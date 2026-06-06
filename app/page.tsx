'use client';
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';

// KONTAK BARU DENGAN PAYER HISTORY
const CONTRACT_ADDRESS = '0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const ARC_CHAIN_ID = '0x4CEF52';

const CONTRACT_ABI = [
  'function createRequest(string description, uint256 amount) returns (bytes32)',
  'function payRequest(bytes32 id) external payable',
  'function getRequests(address user) view returns (bytes32[])',
  'function requests(bytes32) view returns (address creator, string description, uint256 amount, bool paid)',
  'function getPayerHistoryWithDetails(address payer) view returns (bytes32[], uint256[], string[], bool[])'
];

const USDC_ABI = [
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)'
];

// Loading Skeleton Component
const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-white/10 rounded ${className}`} />
);

// Modal Konfirmasi Component
const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  loading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
  loading: boolean;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/20">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-300 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:scale-105 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [balance, setBalance] = useState('0');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [payId, setPayId] = useState('');
  const [loading, setLoading] = useState('');
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchingPayments, setIsFetchingPayments] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error', txHash?: string} | null>(null);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [txHashes, setTxHashes] = useState<{[key: string]: string}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [darkMode, setDarkMode] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'payments'>('requests');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPayId, setPendingPayId] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('arcpay-darkmode');
    if (saved !== null) setDarkMode(saved === 'true');
    const tutorialSeen = localStorage.getItem('arcpay-tutorial');
    if (!tutorialSeen) setShowTutorial(true);
    
    const hash = window.location.hash;
    if (hash && hash.includes('reqId=')) {
      const reqId = hash.split('reqId=')[1];
      if (reqId && reqId.startsWith('0x')) {
        setPayId(reqId);
        showToast('✨ Request ID loaded from magic link!', 'success');
        window.location.hash = '';
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('arcpay-darkmode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const { ethereum } = window as any;
    if (!ethereum) return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWallet('');
        setBalance('0');
        setMyRequests([]);
        setMyPayments([]);
      } else if (accounts[0] !== wallet) {
        setWallet(accounts[0]);
      }
    };
    ethereum.on('accountsChanged', handleAccountsChanged);
    return () => ethereum.removeListener('accountsChanged', handleAccountsChanged);
  }, [wallet]);

  useEffect(() => {
    if (!wallet) return;
    const { ethereum } = window as any;
    if (!ethereum) return;
    const handleBlock = async () => {
      await fetchBalance();
      await fetchMyRequests();
    };
    ethereum.on('block', handleBlock);
    return () => ethereum.removeListener('block', handleBlock);
  }, [wallet]);

  useEffect(() => {
    if (wallet) {
      fetchBalance();
      fetchMyRequests();
      fetchMyPayments();
    }
  }, [wallet]);

  useEffect(() => {
    if (payId && wallet) estimateGas();
    else setGasEstimate(null);
  }, [payId, wallet]);

  async function fetchBalance() {
    if (!wallet) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
      const rawBalance = await usdc.balanceOf(wallet);
      setBalance(ethers.formatUnits(rawBalance, 6));
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchMyPayments() {
    if (!wallet) return;
    setIsFetchingPayments(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const [requestIds, amounts, descriptions] = await contract.getPayerHistoryWithDetails(wallet);
      const paymentData = requestIds.map((id: string, idx: number) => ({
        id: id,
        amount: ethers.formatUnits(amounts[idx], 18),
        description: descriptions[idx]
      }));
      setMyPayments(paymentData);
    } catch (err) {
      console.error(err);
      setMyPayments([]);
    }
    setIsFetchingPayments(false);
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

  async function estimateGas() {
    if (!wallet || !payId) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const gasPrice = await provider.getFeeData();
      const estimate = await contract.payRequest.estimateGas(payId, { value: 1 });
      const feeInEth = Number(estimate) * Number(gasPrice.gasPrice || 0);
      const feeInUsdc = (feeInEth / 1e18).toFixed(6);
      setGasEstimate(`${feeInUsdc} USDC`);
    } catch (err) {
      setGasEstimate('N/A');
    }
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
              nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
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
    setMyPayments([]);
    setTxHashes({});
    setSearchTerm('');
    setFilterStatus('all');
    showToast('Wallet disconnected', 'success');
  }

  async function createRequest() {
    if (!desc || !amount) return showToast('Fill description & amount', 'error');
    if (parseFloat(amount) <= 0) return showToast('Amount must be greater than 0', 'error');
    setLoading('Creating request...');
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const amt = ethers.parseUnits(amount, 18);
      const tx = await contract.createRequest(desc, amt);
      const receipt = await tx.wait();
      const txHash = receipt.hash;
      setTxHashes(prev => ({ ...prev, [desc]: txHash }));
      setDesc(''); setAmount('');
      await fetchMyRequests();
      showToast('✅ Request created! Copy ID below to share', 'success', txHash);
    } catch(e: any) {
      showToast(e.message?.slice(0,60), 'error');
    }
    setLoading('');
  }

  const handlePayClick = () => {
    if (!payId) return showToast('Enter Request ID', 'error');
    setPendingPayId(payId);
    setShowConfirmModal(true);
  };

  const executePay = useCallback(async () => {
    const id = pendingPayId;
    setShowConfirmModal(false);
    setLoading('Processing payment...');
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const req = await contract.requests(id);
      const amountInWei = req.amount;
      const tx = await contract.payRequest(id, { value: amountInWei, gasLimit: 500000 });
      const receipt = await tx.wait();
      const txHash = receipt.hash;
      setTxHashes(prev => ({ ...prev, [id]: txHash }));
      setPayId('');
      await fetchMyRequests();
      await fetchMyPayments();
      await fetchBalance();
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      showToast('🎉 Payment sent!', 'success', txHash);
    } catch(e: any) {
      showToast(e.message?.slice(0,60), 'error');
    }
    setLoading('');
  }, [pendingPayId]);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    showToast('📋 Copied!', 'success');
  }

  function shareRequestLink(requestId: string) {
    const url = `${window.location.origin}/#reqId=${requestId}`;
    navigator.clipboard.writeText(url);
    showToast('🔗 Magic link copied!', 'success');
  }

  function truncateHash(hash: string) {
    return `${hash.slice(0,6)}...${hash.slice(-6)}`;
  }

  function showToast(msg: string, type: 'success' | 'error', txHash?: string) {
    setToast({ msg, type, txHash });
    setTimeout(() => setToast(null), 4000);
  }

  const filteredRequests = myRequests.filter(req => {
    const matchesSearch = req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'pending' && !req.paid) ||
                         (filterStatus === 'paid' && req.paid);
    return matchesSearch && matchesFilter;
  });

  const bgClass = darkMode ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-gray-100 via-white to-gray-100';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const cardBg = darkMode ? 'bg-white/5' : 'bg-white/70';
  const borderClass = darkMode ? 'border-white/10' : 'border-gray-300/30';
  const inputBg = darkMode ? 'bg-black/50' : 'bg-white/80';
  const navBg = darkMode ? 'bg-black/30' : 'bg-white/30';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} font-sans relative overflow-x-hidden transition-all duration-500 animate-gradient`}>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 10s ease infinite;
        }
      `}</style>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executePay}
        title="Confirm Payment"
        message={`You are about to pay for request ID: ${truncateHash(pendingPayId)}. Gas fee: ${gasEstimate || '~0.001 USDC'}. This cannot be undone.`}
        loading={loading === 'Processing payment...'}
      />

      {toast && (
        <div className={`fixed bottom-5 left-5 z-50 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md text-sm font-medium ${toast.type === 'success' ? 'bg-green-600/80' : 'bg-red-600/80'} text-white animate-fadeIn`}>
          <div className="flex items-center gap-2 flex-wrap">
            {toast.msg}
            {toast.txHash && (
              <a href={`https://testnet.arcscan.app/tx/${toast.txHash}`} target="_blank" rel="noopener noreferrer" className="underline text-xs ml-1 hover:text-cyan-200">
                🔗 View
              </a>
            )}
          </div>
        </div>
      )}

      <nav className={`relative z-20 border-b ${borderClass} ${navBg} backdrop-blur-xl sticky top-0 transition-all duration-300`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-lg shadow-lg animate-pulse"></div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">ArcPay</span>
            <span className="text-[10px] font-mono text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">Arc Testnet</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setShowTutorial(true)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-base font-bold">
              ❓
            </button>
            {!wallet ? (
              <button onClick={connectWallet} disabled={isConnecting} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-600 to-cyan-600 text-sm font-medium hover:scale-105 transition disabled:opacity-50 flex items-center gap-2">
                {isConnecting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '✨ Connect'}
              </button>
            ) : (
              <div className={`flex items-center gap-3 ${cardBg} backdrop-blur-md px-3 py-1.5 rounded-full border ${borderClass} flex-wrap`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-mono text-sm">{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
                  <span className="text-xs bg-gradient-to-r from-pink-500/30 to-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    {parseFloat(balance).toFixed(2)} USDC
                    <button onClick={fetchBalance} className="hover:rotate-180 transition" title="Refresh">🔄</button>
                  </span>
                </div>
                <button onClick={disconnectWallet} className="text-gray-300 hover:text-white px-3 py-1 rounded-lg hover:bg-white/10 transition">
                  🔌
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className={`${cardBg} rounded-2xl max-w-md w-full p-6 border ${borderClass}`}>
            <h3 className="text-2xl font-bold mb-3 text-center">✨ ArcPay Tutorial</h3>
            <div className="space-y-3 text-sm">
              <p>1️⃣ <strong>Connect Wallet</strong> – Rabby/MetaMask on Arc Testnet</p>
              <p>2️⃣ <strong>Create Request</strong> – Fill description & amount → Create</p>
              <p>3️⃣ <strong>Share ID</strong> – Copy ID or click 🔗 Magic Link</p>
              <p>4️⃣ <strong>Payer Pays</strong> – Paste ID or click link → Confirm → Pay</p>
              <p>5️⃣ <strong>Done!</strong> – Status "Paid" & balance updates</p>
            </div>
            <p className="text-center text-cyan-400 text-xs mt-3">✨ Happy building on Arc Testnet ✨</p>
            <button onClick={() => { setShowTutorial(false); localStorage.setItem('arcpay-tutorial', 'true'); }} className="mt-4 w-full py-2 rounded-xl bg-gradient-to-r from-pink-600 to-cyan-600 hover:scale-105 transition font-semibold">
              🚀 Got it!
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 text-center pt-8 pb-6 px-4">
        <h1 className="text-4xl sm:text-5xl font-black mb-2 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">USDC Payments</h1>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Send and receive payment requests on Arc L1</p>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          <div className={`${cardBg} backdrop-blur-md rounded-2xl p-5 border ${borderClass} hover:border-pink-500/50 transition hover:scale-[1.02]`}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">📝 Create Request</h2>
            <div className="space-y-4">
              <input type="text" placeholder="What's it for?" value={desc} onChange={(e) => setDesc(e.target.value)} className={`w-full ${inputBg} border ${borderClass} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 transition`} />
              <input type="number" placeholder="Amount (USDC)" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full ${inputBg} border ${borderClass} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 transition`} />
              <button onClick={createRequest} disabled={loading !== '' || !wallet} className="w-full py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-pink-600 to-purple-600 hover:scale-105 transition disabled:opacity-50">
                {loading === 'Creating request...' ? '⏳ Creating...' : '✨ Create'}
              </button>
            </div>
          </div>

          <div className={`${cardBg} backdrop-blur-md rounded-2xl p-5 border ${borderClass} hover:border-cyan-500/50 transition hover:scale-[1.02]`}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">💸 Pay Request</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Request ID (0x...)" value={payId} onChange={(e) => setPayId(e.target.value)} className={`w-full ${inputBg} border ${borderClass} rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-cyan-500 transition`} />
              {gasEstimate && <div className="text-xs text-gray-400 text-center">⛽ Gas: {gasEstimate}</div>}
              <button onClick={handlePayClick} disabled={loading !== '' || !wallet} className="w-full py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-cyan-600 to-teal-600 hover:scale-105 transition disabled:opacity-50">
                {loading === 'Processing payment...' ? '⏳ Paying...' : '💸 Pay'}
              </button>
            </div>
          </div>
        </div>

        {wallet && (
          <>
            <div className="flex gap-4 mt-10 border-b border-white/10 mb-6">
              <button onClick={() => setActiveTab('requests')} className={`pb-2 px-2 transition ${activeTab === 'requests' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400'}`}>
                📋 My Requests
              </button>
              <button onClick={() => setActiveTab('payments')} className={`pb-2 px-2 transition ${activeTab === 'payments' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400'}`}>
                💸 My Payments
              </button>
            </div>

            {activeTab === 'requests' && (
              <div className={`${cardBg} backdrop-blur-md rounded-2xl p-5 border ${borderClass} transition`}>
                <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                  <h2 className="text-lg font-semibold">📋 My Requests</h2>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputBg} border ${borderClass} rounded-xl px-3 py-1.5 text-sm`} />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className={`${inputBg} border ${borderClass} rounded-xl px-3 py-1.5 text-sm`}>
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>
                {isFetching ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-5xl mb-3">📭</div>
                    <p className="text-gray-400 text-sm">No requests yet</p>
                    <button onClick={() => setShowTutorial(true)} className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition">
                      ❓ Need help?
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map((req, idx) => (
                      <div key={idx} className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-white/20 transition">
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="font-medium truncate">{req.description}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <p className="text-xs text-gray-400 font-mono">{truncateHash(req.id)}</p>
                              <button onClick={() => copyToClipboard(req.id)} className="bg-gray-700 hover:bg-cyan-600 px-2 py-1 rounded text-xs flex items-center gap-1">
                                📋 Copy
                              </button>
                              <button onClick={() => shareRequestLink(req.id)} className="bg-gray-700 hover:bg-green-600 px-2 py-1 rounded text-xs flex items-center gap-1">
                                🔗 Share
                              </button>
                              {txHashes[req.id] && <a href={`https://testnet.arcscan.app/tx/${txHashes[req.id]}`} target="_blank" className="text-xs text-cyan-400">🔍 Tx</a>}
                            </div>
                            <p className="text-xs text-cyan-300 mt-1">{ethers.formatUnits(req.amount, 18)} USDC</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`text-xs px-3 py-1 rounded-full ${req.paid ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'} border`}>
                              {req.paid ? '✅ Paid' : '⏳ Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className={`${cardBg} backdrop-blur-md rounded-2xl p-5 border ${borderClass} transition`}>
                <h2 className="text-lg font-semibold mb-4">💸 My Payments</h2>
                {isFetchingPayments ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : myPayments.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-5xl mb-3">💸</div>
                    <p className="text-gray-400 text-sm">No payments yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myPayments.map((payment, idx) => (
                      <div key={idx} className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-white/20 transition">
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="font-medium truncate">{payment.description}</p>
                            <p className="text-xs text-gray-400 font-mono mt-1">{truncateHash(payment.id)}</p>
                            <p className="text-xs text-cyan-300 mt-1">{payment.amount} USDC</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">
                              ✅ Completed
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="mt-12 p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center">
          <h3 className="text-sm font-semibold mb-2">📖 Quick Tutorial</h3>
          <div className="text-xs text-gray-400 space-x-3 flex flex-wrap justify-center gap-y-2">
            <span>1️⃣ Connect</span><span>➡️</span>
            <span>2️⃣ Create</span><span>➡️</span>
            <span>3️⃣ Share ID</span><span>➡️</span>
            <span>4️⃣ Pay</span><span>➡️</span>
            <span>5️⃣ Done ✅</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">❓ Click the ❓ button for full tutorial</p>
        </div>

        <div className="text-center mt-10 pt-6 border-t border-white/10">
          <p className="text-gray-400 text-xs">✦ Built on Arc Testnet — USDC by Circle ✦</p>
          <p className="text-gray-500 text-[10px] font-mono mt-1">arcpay · {CONTRACT_ADDRESS.slice(0,8)}...{CONTRACT_ADDRESS.slice(-6)}</p>
        </div>
      </div>
    </div>
  );
}
