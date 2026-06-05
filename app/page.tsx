'use client';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

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
  }

  async function connectWallet() {
    setIsConnecting(true);
    const { ethereum } = window as any;
    if (!ethereum) {
      alert('Install MetaMask or Rabby wallet first!');
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
    } catch (err: any) {
      alert(err.message?.slice(0, 100));
    }
    setIsConnecting(false);
  }

  async function disconnectWallet() {
    setWallet('');
    setBalance('0');
    setMyRequests([]);
  }

  async function createRequest() {
    if (!desc || !amount) return;
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
    } catch(e: any) {
      alert(e.message?.slice(0,60));
    }
    setLoading('');
  }

  async function payRequest() {
    if (!payId) return;
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
    } catch(e: any) {
      alert(e.message?.slice(0,60));
    }
    setLoading('');
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('Request ID copied!');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath fill=\'%2318182f\' fill-opacity=\'0.4\' d=\'M20 20L40 0 40 40 20 20zM0 40L20 20 0 0 0 40z\'/%3E%3C/svg%3E')] opacity-20" />

      <nav className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-lg shadow-lg shadow-pink-500/25"></div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">ArcPay</span>
            <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">Arc Testnet</span>
          </div>
          {!wallet ? (
            <button onClick={connectWallet} disabled={isConnecting} className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-600 to-cyan-600 text-sm font-medium hover:shadow-lg disabled:opacity-50">
              {isConnecting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : '✨ Connect Wallet'}
            </button>
          ) : (
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-mono text-sm">{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
                <span className="text-xs bg-gradient-to-r from-pink-500/20 to-cyan-500/20 px-2 py-0.5 rounded-full">{parseFloat(balance).toFixed(2)} USDC</span>
              </div>
              <button onClick={disconnectWallet} className="text-gray-400 hover:text-white">🔌</button>
            </div>
          )}
        </div>
      </nav>

      <div className="relative z-10 text-center pt-12 pb-8">
        <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">USDC Payments</h1>
        <p className="text-gray-400 text-sm">Send and receive payment requests on Arc L1</p>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Request Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-pink-500/50 transition">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">📝 Create Request</h2>
            <div className="space-y-4">
              <input type="text" placeholder="What's it for?" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500" />
              <input type="number" placeholder="Amount (USDC)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500" />
              <button onClick={createRequest} disabled={loading !== '' || !wallet} className="w-full py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-pink-600 to-purple-600 hover:shadow-lg disabled:opacity-50">
                {loading === 'Creating request...' ? 'Creating...' : '✨ Create Request'}
              </button>
            </div>
          </div>

          {/* Pay Request Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 transition">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">💸 Pay Request</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Request ID (0x...)" value={payId} onChange={(e) => setPayId(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-cyan-500" />
              <button onClick={payRequest} disabled={loading !== '' || !wallet} className="w-full py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-cyan-600 to-teal-600 hover:shadow-lg disabled:opacity-50">
                {loading === 'Processing payment...' ? 'Paying...' : '💸 Pay Request'}
              </button>
            </div>
          </div>
        </div>

        {/* My Requests Section */}
        {wallet && (
          <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">📋 My Requests</h2>
            {myRequests.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No requests yet. Create one above!</p>
            ) : (
              <div className="space-y-3">
                {myRequests.map((req, idx) => (
                  <div key={idx} className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-white/10 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{req.description}</p>
                        <p className="text-xs text-gray-400 font-mono break-all">{req.id}</p>
                        <p className="text-xs text-cyan-300 mt-1">{ethers.formatUnits(req.amount, 6)} USDC</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${req.paid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {req.paid ? 'Paid ✓' : 'Pending'}
                        </span>
                        {!req.paid && (
                          <button onClick={() => copyToClipboard(req.id)} className="text-xs text-gray-400 hover:text-white transition">📋 Copy ID</button>
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
        <div className="text-center mt-12 pt-6 border-t border-white/5">
          <p className="text-gray-400 text-xs">✦ Built on Arc Testnet — USDC by Circle ✦</p>
          <p className="text-gray-600 text-[10px] font-mono mt-1">arcpay · {CONTRACT_ADDRESS.slice(0,8)}...{CONTRACT_ADDRESS.slice(-6)}</p>
        </div>
      </div>
    </div>
  );
}
