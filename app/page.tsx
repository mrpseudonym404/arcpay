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
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState('');
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

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
    const { ethereum } = window as any;
    if (!ethereum) {
      alert('Install MetaMask or Rabby wallet first!');
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
      showNotification(`✅ Request created! ${tx.hash.slice(0,20)}...`, 'success');
      setDesc(''); setAmount('');
    } catch(e: any) {
      showNotification(`❌ ${e.message?.slice(0,60)}`, 'error');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'} animate-pulse`}>
          {notification.msg}
        </div>
      )}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg"></div>
            <span className="font-bold text-xl">ArcPay</span>
            <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">Arc Testnet</span>
          </div>
          {!wallet ? (
            <button onClick={connectWallet} className="bg-cyan-500 hover:bg-cyan-600 px-5 py-2 rounded-lg font-medium transition">
              Connect Wallet
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-mono text-sm">{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
              <span className="text-cyan-300 text-sm">| {balance} USDC</span>
            </div>
          )}
        </div>
      </nav>
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            USDC Payment Requests
          </h1>
          <p className="text-slate-400 text-lg">Send and receive payment requests on Arc L1 blockchain</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">📝 Create Request</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Description (e.g., 'Website design')" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500" />
              <input type="number" placeholder="Amount (USDC)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500" />
              <button onClick={createRequest} disabled={loading !== '' || !wallet} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 py-3 rounded-lg font-medium transition">
                {loading === 'Creating request...' ? 'Processing...' : 'Create Request'}
              </button>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">💸 Pay Request</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Request ID (bytes32)" value={payId} onChange={(e) => setPayId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:border-cyan-500" />
              <button onClick={payRequest} disabled={loading !== '' || !wallet} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 py-3 rounded-lg font-medium transition">
                {loading === 'Processing payment...' ? 'Processing...' : 'Pay Request'}
              </button>
            </div>
          </div>
        </div>
        <div className="text-center mt-12 text-slate-500 text-sm">
          Powered by Circle Arc Testnet | USDC Payment Requests
        </div>
      </main>
    </div>
  );
}
