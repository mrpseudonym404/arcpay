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
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (wallet) fetchBalance();
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

  async function connectWallet() {
    setIsConnecting(true);
    const { ethereum } = window as any;
    if (!ethereum) {
      showNotification('Install MetaMask or Rabby wallet first!', 'error');
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
      showNotification(`Connected: ${address.slice(0,6)}...${address.slice(-4)}`, 'success');
    } catch (err: any) {
      showNotification(err.message?.slice(0, 100), 'error');
    }
    setIsConnecting(false);
  }

  async function disconnectWallet() {
    setWallet('');
    setBalance('0');
    showNotification('Wallet disconnected', 'success');
  }

  async function createRequest() {
    if (!desc || !amount) return showNotification('Fill description & amount', 'error');
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
      showNotification(`✅ Request created! ${tx.hash.slice(0,20)}...`, 'success');
      setDesc(''); setAmount('');
    } catch(e: any) {
      showNotification(`❌ ${e.message?.slice(0,60)}`, 'error');
    }
    setLoading('');
  }

  async function payRequest() {
    if (!payId) return showNotification('Enter Request ID', 'error');
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
      showNotification(`✅ Payment sent! ${tx.hash.slice(0,20)}...`, 'success');
      setPayId('');
    } catch(e: any) {
      showNotification(`❌ ${e.message?.slice(0,60)}`, 'error');
    }
    setLoading('');
  }

  function showNotification(msg: string, type: 'success' | 'error') {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${notification.type === 'success' ? 'bg-green-600/90 text-white' : 'bg-red-600/90 text-white'}`}>
          {notification.type === 'success' ? '✅' : '❌'} {notification.msg}
        </div>
      )}

      {/* Navbar */}
      <nav className="border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-xl shadow-lg flex items-center justify-center font-bold text-xl">A</div>
            <div>
              <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">ArcPay</span>
              <p className="text-xs text-gray-400">on Arc Testnet</p>
            </div>
          </div>

          {!wallet ? (
            <button 
              onClick={connectWallet} 
              disabled={isConnecting}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 px-6 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-2"
            >
              {isConnecting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                '🔌 Connect Wallet'
              )}
            </button>
          ) : (
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                <span className="font-mono text-sm tracking-wider">{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
                <span className="text-cyan-300 text-sm bg-cyan-500/10 px-2 py-0.5 rounded-full">{parseFloat(balance).toFixed(2)} USDC</span>
              </div>
              <button 
                onClick={disconnectWallet}
                className="text-gray-400 hover:text-white transition-colors text-sm px-2 py-1 rounded-lg hover:bg-white/10"
                title="Disconnect"
              >
                🔌 Disconnect
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-purple-500/10 blur-3xl" />
        <div className="container mx-auto px-6 py-16 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
            USDC Payment Requests
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Send and receive payment requests on Arc L1 blockchain — Fast, cheap, and secure.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="container mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Create Request Card */}
          <div className="group bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 hover:border-cyan-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition">📝</div>
              <h2 className="text-2xl font-bold">Create Request</h2>
            </div>
            <div className="space-y-5">
              <input
                type="text"
                placeholder="What's it for? (e.g., Logo Design)"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-xl px-5 py-3.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition placeholder:text-gray-500"
              />
              <input
                type="number"
                placeholder="Amount (USDC)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-xl px-5 py-3.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
              <button
                onClick={createRequest}
                disabled={loading !== '' || !wallet}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 py-3.5 rounded-xl font-semibold transition-all duration-300"
              >
                {loading === 'Creating request...' ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  '🚀 Create Request'
                )}
              </button>
            </div>
          </div>

          {/* Pay Request Card */}
          <div className="group bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 hover:border-emerald-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition">💸</div>
              <h2 className="text-2xl font-bold">Pay Request</h2>
            </div>
            <div className="space-y-5">
              <input
                type="text"
                placeholder="Request ID (0x...)"
                value={payId}
                onChange={(e) => setPayId(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-xl px-5 py-3.5 font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              <button
                onClick={payRequest}
                disabled={loading !== '' || !wallet}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 py-3.5 rounded-xl font-semibold transition-all duration-300"
              >
                {loading === 'Processing payment...' ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Paying...
                  </div>
                ) : (
                  '💸 Pay Request'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-20 pt-8 border-t border-white/10 text-gray-400 text-sm">
          <p>Powered by <span className="text-cyan-400">Circle Arc Testnet</span> | USDC Payment Requests</p>
          <p className="mt-2 text-xs">Contract: {CONTRACT_ADDRESS.slice(0,10)}...{CONTRACT_ADDRESS.slice(-8)}</p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
        }
      `}</style>
    </div>
  );
}
