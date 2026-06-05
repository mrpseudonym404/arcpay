'use client';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';

const CONTRACT_ADDRESS = '0xCb3C8104ba53ec98513e2AD4f02135B2704cB84b';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const ARC_CHAIN_ID = '0x4CEF52';

const CONTRACT_ABI = [
  'function createRequest(string description, uint256 amount) returns (bytes32)',
  'function pay(bytes32 id) external',
  'function getRequests(address user) view returns (bytes32[])',
  'function requests(bytes32) view returns (address creator, string description, uint256 amount, bool paid)'
];

const USDC_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)'
];

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [balance, setBalance] = useState('0');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [payId, setPayId] = useState('');
  const [loading, setLoading] = useState('');
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    const { ethereum } = window as any;
    if (!ethereum) return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWallet('');
        setBalance('0');
        setMyRequests([]);
      } else if (accounts[0] !== wallet) {
        setWallet(accounts[0]);
      }
    };
    ethereum.on('accountsChanged', handleAccountsChanged);
    return () => ethereum.removeListener('accountsChanged', handleAccountsChanged);
  }, [wallet]);

  useEffect(() => {
    if (wallet) {
      fetchBalance();
      fetchMyRequests();
    }
  }, [wallet]);

  async function fetchBalance() {
    if (!wallet) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
      const decimals = await usdc.decimals();
      const rawBalance = await usdc.balanceOf(wallet);
      setBalance(ethers.formatUnits(rawBalance, decimals));
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchMyRequests() {
    if (!wallet) return;
    setIsFetching(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const ids = await contract.getRequests(wallet);
      const requestsData = await Promise.all(ids.map(async (id: string) => {
        const req = await contract.requests(id);
        return { id, description: req.description, amount: req.amount, paid: req.paid };
      }));
      setMyRequests(requestsData);
    } catch (err) {
      console.error(err);
    }
    setIsFetching(false);
  }

  async function connectWallet() {
    setIsConnecting(true);
    const { ethereum } = window as any;
    if (!ethereum) {
      showToast('Install MetaMask or Rabby wallet first!', 'error');
      setIsConnecting(false);
      return;
    }
    try {
      await ethereum.request({ method: 'eth_requestAccounts' });
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ARC_CHAIN_ID }]
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: ARC_CHAIN_ID,
              chainName: 'Arc Testnet',
              rpcUrls: ['https://rpc.testnet.arc.network'],
              nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
              blockExplorerUrls: ['https://testnet.arcscan.app']
            }]
          });
        } else throw switchError;
      }
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWallet(address);
      showToast(`Connected: ${address.slice(0,6)}...${address.slice(-4)}`, 'success');
    } catch (err: any) {
      showToast(err.message?.slice(0, 100), 'error');
    }
    setIsConnecting(false);
  }

  async function disconnectWallet() {
    setWallet('');
    setBalance('0');
    setMyRequests([]);
    showToast('Wallet disconnected', 'success');
  }

  async function createRequest() {
    if (!desc || !amount) return showToast('Fill description & amount', 'error');
    setLoading('Creating request...');
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const decimals = await usdc.decimals();
      const amt = ethers.parseUnits(amount, decimals);
      const tx = await contract.createRequest(desc, amt);
      await tx.wait();
      setDesc(''); setAmount('');
      await fetchMyRequests();
      showToast('Request created successfully!', 'success');
    } catch(e: any) {
      showToast(e.message?.slice(0,60), 'error');
    }
    setLoading('');
  }

  async function payRequest() {
    if (!payId) return showToast('Enter Request ID', 'error');
    setLoading('Processing payment...');
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const req = await contract.requests(payId);
      await (await usdc.approve(CONTRACT_ADDRESS, req.amount)).wait();
      const tx = await contract.pay(payId);
      await tx.wait();
      setPayId('');
      await fetchMyRequests();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      showToast('Payment sent successfully! 🎉', 'success');
    } catch(e: any) {
      showToast(e.message?.slice(0,60), 'error');
    }
    setLoading('');
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    showToast('Request ID copied!', 'success');
  }

  function truncateHash(hash: string) {
    return `${hash.slice(0,6)}...${hash.slice(-6)}`;
  }

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 animate-gradient">
      
      {/* Animated Gradient Background */}
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
      `}</style>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md text-sm font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600/80 text-white' : 'bg-red-600/80 text-white'}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-lg shadow-lg shadow-pink-500/25 animate-pulse"></div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">ArcPay</span>
            <span className="text-[10px] font-mono text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">Arc Testnet</span>
          </div>
          {!wallet ? (
            <button onClick={connectWallet} disabled={isConnecting} className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-600 to-cyan-600 text-sm font-medium hover:scale-105 transition-transform disabled:opacity-50">
              {isConnecting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : '✨ Connect Wallet'}
            </button>
          ) : (
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="font-mono text-sm">{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
                <span className="text-xs bg-gradient-to-r from-pink-500/30 to-cyan-500/30 px-2 py-0.5 rounded-full">{parseFloat(balance).toFixed(2)} USDC</span>
              </div>
              <button onClick={disconnectWallet} className="text-gray-300 hover:text-white transition-colors">🔌</button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 text-center pt-12 pb-8">
        <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg animate-pulse">USDC Payments</h1>
        <p className="text-gray-300 text-sm">Send and receive payment requests on Arc L1</p>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Request Card */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-pink-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-pink-500/20">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">📝 Create Request</h2>
            <div className="space-y-4">
              <input type="text" placeholder="What's it for?" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 transition" />
              <input type="number" placeholder="Amount (USDC)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 transition" />
              <button onClick={createRequest} disabled={loading !== '' || !wallet} className="w-full py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-pink-600 to-purple-600 hover:scale-105 transition-transform disabled:opacity-50">
                {loading === 'Creating request...' ? 'Creating...' : '✨ Create Request'}
              </button>
            </div>
          </div>

          {/* Pay Request Card */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/20">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">💸 Pay Request</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Request ID (0x...)" value={payId} onChange={(e) => setPayId(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-cyan-500 transition" />
              <button onClick={payRequest} disabled={loading !== '' || !wallet} className="w-full py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-cyan-600 to-teal-600 hover:scale-105 transition-transform disabled:opacity-50">
                {loading === 'Processing payment...' ? 'Paying...' : '💸 Pay Request'}
              </button>
            </div>
          </div>
        </div>

        {/* My Requests Section */}
        {wallet && (
          <div className="mt-12 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">📋 My Requests</h2>
            {isFetching ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="bg-black/30 rounded-xl p-4 border border-white/5 animate-pulse">
                    <div className="h-5 bg-white/20 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-white/10 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : myRequests.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No requests yet. Create one above!</p>
            ) : (
              <div className="space-y-3">
                {myRequests.map((req, idx) => (
                  <div key={idx} className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-white">{req.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-400 font-mono">{truncateHash(req.id)}</p>
                          <button onClick={() => copyToClipboard(req.id)} className="text-gray-500 hover:text-cyan-400 transition text-xs" title="Copy full ID">📋</button>
                        </div>
                        <p className="text-xs text-cyan-300 mt-1">{ethers.formatUnits(req.amount, 6)} USDC</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full ${req.paid ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                          {req.paid ? 'Paid ✓' : 'Pending'}
                        </span>
                        {!req.paid && (
                          <button onClick={() => copyToClipboard(req.id)} className="text-xs text-cyan-400 hover:text-cyan-300 transition">📋 Copy ID</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-6 border-t border-white/10">
          <p className="text-gray-400 text-xs">✦ Built on Arc Testnet — USDC by Circle ✦</p>
          <p className="text-gray-500 text-[10px] font-mono mt-1">arcpay · {CONTRACT_ADDRESS.slice(0,8)}...{CONTRACT_ADDRESS.slice(-6)}</p>
        </div>
      </div>
    </div>
  );
}
