'use client';
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import QRCode from 'react-qr-code';
import { 
  Sparkles, Wallet, Send, Copy, Share2, ExternalLink, 
  Moon, Sun, HelpCircle, Download, Search, ChevronLeft, 
  ChevronRight, CheckCircle, Clock, Award, Zap, Star, 
  Shield, Trophy, Layers, Home, Droplet, X, ShieldCheck, 
  FileText, Cookie, Menu, BookOpen, Gift, Flame, TrendingUp,
  BarChart3, User, Gem, Medal, BadgeCheck
} from 'lucide-react';

const CONTRACT_ADDRESS = '0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const MEMO_ADDRESS = '0x5294E9927c3306DcBaDb03fe70b92e01cCede505';
const ARC_CHAIN_ID = '0x4CEF52';
const SIMPLE_BADGE_ADDRESS = '0x4ceB5d7AB432339eCe9Ed41E3B93fF2466834Cd8';
const DAILY_BADGE_CONTRACT_ADDRESS = '0xA9323D36E49aC6aC49F38aAd431f4C2b69280475';

const CONTRACT_ABI = [
  'function createRequest(string description, uint256 amount) returns (bytes32)',
  'function payRequest(bytes32 id) external payable',
  'function getRequests(address user) view returns (bytes32[])',
  'function requests(bytes32) view returns (address creator, string description, uint256 amount, bool paid)',
  'function getPayerHistoryWithDetails(address payer) view returns (bytes32[], uint256[], string[], bool[])'
];

const SIMPLE_BADGE_ABI = [
  'function updateStats(address, uint256, uint256)',
  'function updateStreak(address)',
  'function checkEligibility(address, uint8) view returns (bool)',
  'function mintBadge(uint8)',
  'function hasBadge(address, uint8) view returns (bool)',
  'function getPoints(address) view returns (uint256)',
  'function getUserStats(address) view returns (uint256, uint256, uint256, uint256)'
];

const DAILY_BADGE_ABI = [
  'function mintDailyBadge() external',
  'function canMintToday(address) view returns (bool)',
  'function totalBadges(address) view returns (uint256)',
  'function mintStreak(address) view returns (uint256)'
];

const USDC_ABI = [
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)'
];

const MEMO_ABI = [
  'function memo(address target, bytes calldata data, bytes32 memoId, bytes calldata memoData) external'
];

const badgeConfig = [
  { id: 0, name: 'First Request', icon: '🎯', color: 'bg-emerald-500' },
  { id: 1, name: 'First Payment', icon: '💰', color: 'bg-blue-500' },
  { id: 2, name: '10 Requests', icon: '🏆', color: 'bg-purple-500' },
  { id: 3, name: '100 USDC Paid', icon: '🐋', color: 'bg-cyan-500' },
  { id: 4, name: '7 Day Streak', icon: '🔥', color: 'bg-orange-500' },
  { id: 5, name: 'Legend', icon: '👑', color: 'bg-yellow-500' }
];

const dailyBadgeIcons = ['⚡', '🔥', '🌊', '🪨', '🌱', '🕊️', '⭐'];
const dailyBadgeNames = ['Spark', 'Ember', 'Wave', 'Stone', 'Seed', 'Wing', 'Star'];
const vibeQuestions = ["You're doing great!", "Keep building!", "Another step closer!", "You're on fire!", "Quality work!", "To the moon!"];

const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = ['Description', 'Amount (USDC)', 'Request ID', 'Date'];
  const rows = data.map(item => [`"${item.description.replace(/"/g, '""')}"`, item.amount, item.id, new Date().toLocaleDateString()]);
  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center gap-3 mt-5">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-1.5 rounded-lg bg-white/10 disabled:opacity-30 hover:bg-white/20 transition-all hover:scale-105 text-sm flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Prev</button>
      <span className="px-3 py-1.5 text-sm bg-white/5 rounded-lg font-mono">{currentPage} / {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-1.5 rounded-lg bg-white/10 disabled:opacity-30 hover:bg-white/20 transition-all hover:scale-105 text-sm flex items-center gap-1">Next <ChevronRight className="w-3 h-3" /></button>
    </div>
  );
};

const Skeleton = ({ className }: { className: string }) => <div className={`animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded ${className}`} />;

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, loading }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; loading: boolean }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/20 shadow-2xl">
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" /> {title}</h3>
        <p className="text-gray-300 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition text-sm" disabled={loading}>Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:shadow-lg hover:shadow-cyan-500/30 transition-all hover:scale-105 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2" disabled={loading}>
            {loading ? <><Zap className="w-4 h-4 animate-spin" /> Processing...</> : <><CheckCircle className="w-4 h-4" /> Confirm</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const MintBadgeModal = ({ isOpen, onClose, onMint, badgeName, loading }: { isOpen: boolean; onClose: () => void; onMint: () => void; badgeName: string; loading: boolean }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/20 shadow-2xl">
        <div className="text-center mb-4">
          <div className="text-6xl mb-2">🎉</div>
          <h3 className="text-2xl font-bold">Badge Earned!</h3>
          <p className="text-gray-300 text-sm mt-2">You've unlocked: <span className="text-cyan-400 font-bold">{badgeName}</span></p>
        </div>
        <p className="text-gray-400 text-sm text-center mb-6">Mint this badge to add to your collection and earn points.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition text-sm" disabled={loading}>Later</button>
          <button onClick={onMint} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:shadow-lg hover:shadow-cyan-500/30 transition-all hover:scale-105 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2" disabled={loading}>
            {loading ? <><Zap className="w-4 h-4 animate-spin" /> Minting...</> : <><Award className="w-4 h-4" /> Mint Badge</>}
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
  const [activeTab, setActiveTab] = useState<'requests' | 'payments' | 'badges' | 'leaderboard' | 'analytics'>('requests');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPayId, setPendingPayId] = useState('');
  const [userPoints, setUserPoints] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [userBadges, setUserBadges] = useState<boolean[]>(Array(6).fill(false));
  const [totalBadges, setTotalBadges] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [canMintToday, setCanMintToday] = useState(false);
  const [tierName, setTierName] = useState('Unranked');
  const [tierIcon, setTierIcon] = useState('⚪');
  const [leaderboard, setLeaderboard] = useState<{address: string, points: number}[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [requestsPage, setRequestsPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [showMintModal, setShowMintModal] = useState(false);
  const [pendingBadge, setPendingBadge] = useState<{id: number, name: string} | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrRequestId, setQrRequestId] = useState('');
  const itemsPerPage = 5;

  const totalRequests = myRequests.length;
  const totalPayments = myPayments.length;
  const totalVolume = myPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const pendingRequests = myRequests.filter(r => !r.paid).length;
  const paidRequests = myRequests.filter(r => r.paid).length;
  const userBadgeCount = userBadges.filter(b => b).length;
  const badgeProgress = (userBadgeCount / 6) * 100;
  const nextBadgeNames = ["First Request", "First Payment", "10 Requests", "100 USDC Paid", "7 Day Streak", "Legend"];
  const nextBadgeName = nextBadgeNames[userBadges.findIndex(b => !b)] || "All badges collected!";

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
        showToast('✨ Magic link loaded!', 'success');
        window.location.hash = '';
      }
    }
  }, []);

  useEffect(() => { localStorage.setItem('arcpay-darkmode', String(darkMode)); }, [darkMode]);

  useEffect(() => {
    const { ethereum } = window as any;
    if (!ethereum) return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWallet(''); setBalance('0'); setMyRequests([]); setMyPayments([]);
        setUserPoints(0); setUserStreak(0); setUserBadges(Array(6).fill(false)); setTotalBadges(0); setDailyStreak(0);
      } else if (accounts[0] !== wallet) setWallet(accounts[0]);
    };
    ethereum.on('accountsChanged', handleAccountsChanged);
    return () => ethereum.removeListener('accountsChanged', handleAccountsChanged);
  }, [wallet]);

  useEffect(() => {
    if (!wallet) return;
    const { ethereum } = window as any;
    if (!ethereum) return;
    const handleBlock = async () => { await fetchBalance(); await fetchMyRequests(); await fetchUserStats(); await fetchDailyBadgeStatus(); };
    ethereum.on('block', handleBlock);
    return () => ethereum.removeListener('block', handleBlock);
  }, [wallet]);

  useEffect(() => {
    if (wallet) { fetchBalance(); fetchMyRequests(); fetchMyPayments(); fetchUserStats(); fetchLeaderboard(); fetchDailyBadgeStatus(); }
  }, [wallet]);

  useEffect(() => { if (payId && wallet) estimateGas(); else setGasEstimate(null); }, [payId, wallet]);
  useEffect(() => { setRequestsPage(1); }, [myRequests.length, searchTerm, filterStatus]);
  useEffect(() => { setPaymentsPage(1); }, [myPayments.length]);

  async function fetchDailyBadgeStatus() {
    if (!wallet || DAILY_BADGE_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const badgeContract = new ethers.Contract(DAILY_BADGE_CONTRACT_ADDRESS, DAILY_BADGE_ABI, provider);
      setCanMintToday(await badgeContract.canMintToday(wallet));
      setDailyStreak(Number(await badgeContract.mintStreak(wallet)));
      setTotalBadges(Number(await badgeContract.totalBadges(wallet)));
    } catch (err) { console.error(err); }
  }

  async function mintDailyBadge() {
    if (!canMintToday) { showToast('Already minted today! Come back tomorrow', 'error'); return; }
    setLoading('Minting badge...');
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const badgeContract = new ethers.Contract(DAILY_BADGE_CONTRACT_ADDRESS, DAILY_BADGE_ABI, signer);
      await (await badgeContract.mintDailyBadge()).wait();
      await fetchDailyBadgeStatus();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#fbbf24', '#f59e0b', '#ef4444'] });
      showToast('🎖️ Daily badge minted! Come back tomorrow for another one!', 'success');
    } catch(e: any) { showToast(e.message?.slice(0,60), 'error'); }
    setLoading('');
  }

  async function fetchUserStats() {
    if (!wallet || SIMPLE_BADGE_ADDRESS === '0x0000000000000000000000000000000000000000') return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const badgeContract = new ethers.Contract(SIMPLE_BADGE_ADDRESS, SIMPLE_BADGE_ABI, provider);
      const points = await badgeContract.getPoints(wallet);
      setUserPoints(Number(points));
      const badges = await Promise.all(badgeConfig.map(async (b) => await badgeContract.hasBadge(wallet, b.id)));
      setUserBadges(badges);
    } catch (err) { console.error(err); }
  }

  async function fetchLeaderboard() {
    setLeaderboard([
      { address: '0x71a2...b8e4', points: 1250 },
      { address: '0x83b4...d9f2', points: 980 },
      { address: '0x95c6...e0a1', points: 750 },
      { address: '0xa7d8...f1b3', points: 520 },
      { address: '0xb9e0...g2c4', points: 310 }
    ]);
  }

  async function fetchBalance() {
    if (!wallet) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
      setBalance(ethers.formatUnits(await usdc.balanceOf(wallet), 6));
    } catch (err) { console.error(err); }
  }

  async function fetchMyPayments() {
    if (!wallet) return;
    setIsFetchingPayments(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const [requestIds, amounts, descriptions] = await contract.getPayerHistoryWithDetails(wallet);
      setMyPayments(requestIds.map((id: string, idx: number) => ({ id, amount: ethers.formatUnits(amounts[idx], 18), description: descriptions[idx] })).reverse());
    } catch (err) { setMyPayments([]); }
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
        return { id, description: req.description, amount: ethers.formatUnits(req.amount, 18), paid: req.paid };
      }));
      setMyRequests(requestsData.reverse());
    } catch (err) { console.error(err); }
    setIsFetching(false);
  }

  async function estimateGas() {
    if (!wallet || !payId) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const gasPrice = await provider.getFeeData();
      const reqData = await contract.requests(payId);
      const estimate = await contract.payRequest.estimateGas(payId, { value: reqData.amount });
      setGasEstimate(`${(Number(estimate) * Number(gasPrice.gasPrice || 0) / 1e18).toFixed(6)} USDC`);
    } catch (err) { setGasEstimate('N/A'); }
  }

  async function connectWallet() {
    setIsConnecting(true);
    const { ethereum } = window as any;
    if (!ethereum) { showToast('Install MetaMask or Rabby wallet first', 'error'); setIsConnecting(false); return; }
    try {
      await ethereum.request({ method: 'eth_requestAccounts' });
      try { await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ARC_CHAIN_ID }] }); } catch (switchError: any) {
        if (switchError.code === 4902) await ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: ARC_CHAIN_ID, chainName: 'Arc Testnet', rpcUrls: ['https://rpc.testnet.arc.network'], nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, blockExplorerUrls: ['https://testnet.arcscan.app'] }] });
        else throw switchError;
      }
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWallet(address);
      showToast(`Connected: ${address.slice(0,6)}...${address.slice(-4)}`, 'success');
      if (SIMPLE_BADGE_ADDRESS !== '0x0000000000000000000000000000000000000000') {
        const badgeContract = new ethers.Contract(SIMPLE_BADGE_ADDRESS, SIMPLE_BADGE_ABI, signer);
        try { await badgeContract.updateStreak(address); } catch(e) {}
      }
      await fetchDailyBadgeStatus();
    } catch (err: any) { showToast(err.message?.slice(0, 100), 'error'); }
    setIsConnecting(false);
  }

  async function disconnectWallet() {
    setWallet(''); setBalance('0'); setMyRequests([]); setMyPayments([]); setTxHashes({}); setSearchTerm(''); setFilterStatus('all');
    setUserPoints(0); setUserStreak(0); setUserBadges(Array(6).fill(false)); setTotalBadges(0); setDailyStreak(0);
    showToast('Wallet disconnected', 'success');
  }

  const handleMintBadge = async () => {
    if (!pendingBadge) return;
    setLoading('Minting badge...');
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const badgeContract = new ethers.Contract(SIMPLE_BADGE_ADDRESS, SIMPLE_BADGE_ABI, signer);
      await badgeContract.mintBadge(pendingBadge.id, { gasLimit: 300000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchUserStats();
      await fetchDailyBadgeStatus();
      setShowMintModal(false);
      setPendingBadge(null);
      showToast(`🎖️ ${pendingBadge.name} badge minted!`, 'success');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch(e: any) {
      showToast(e.message?.slice(0,60), 'error');
    }
    setLoading('');
  };

  const checkAndMintBadge = async (badgeId: number, badgeName: string) => {
    if (userBadges[badgeId]) {
      showToast(`✨ ${badgeName} badge already minted!`, 'success');
      return;
    }
    setLoading('Checking badge...');
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const badgeContract = new ethers.Contract(SIMPLE_BADGE_ADDRESS, SIMPLE_BADGE_ABI, signer);
      const hasBadge = await badgeContract.hasBadge(wallet, badgeId);
      if (!hasBadge) {
        setPendingBadge({ id: badgeId, name: badgeName });
        setShowMintModal(true);
      } else {
        showToast(`✨ ${badgeName} badge already minted!`, 'success');
        await fetchUserStats();
      }
    } catch(e: any) {
      showToast(e.message?.slice(0,60), 'error');
    }
    setLoading('');
  };

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
      await fetchMyRequests(); await fetchUserStats();
      
      if (SIMPLE_BADGE_ADDRESS !== '0x0000000000000000000000000000000000000000') {
        try {
          const badgeContract = new ethers.Contract(SIMPLE_BADGE_ADDRESS, SIMPLE_BADGE_ABI, signer);
          await badgeContract.updateStats(wallet, 1, 0, { gasLimit: 300000 });
          const hasFirstBadge = await badgeContract.hasBadge(wallet, 0);
          if (!hasFirstBadge) {
            setPendingBadge({ id: 0, name: 'First Request' });
            setShowMintModal(true);
          }
        } catch (badgeError) { console.error("Badge award failed:", badgeError); }
      }
      const randomVibe = vibeQuestions[Math.floor(Math.random() * vibeQuestions.length)];
      showToast(`✅ Request created. ${randomVibe}`, 'success', txHash);
    } catch(e: any) { showToast(e.message?.slice(0,60), 'error'); }
    setLoading('');
  }

  const handlePayClick = () => { if (!payId) return showToast('Enter Request ID', 'error'); setPendingPayId(payId); setShowConfirmModal(true); };
  
  const executePay = useCallback(async () => {
    const id = pendingPayId;
    setShowConfirmModal(false);
    setLoading('Processing payment...');
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      // 1. Dapatkan data request
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const req = await contract.requests(id);
      const amountInWei = req.amount;
      
      // 2. Encode USDC transfer
      const usdcInterface = new ethers.Interface([
        'function transfer(address to, uint256 amount) returns (bool)'
      ]);
      const transferData = usdcInterface.encodeFunctionData('transfer', [req.creator, amountInWei]);
      
      // 3. Encode memoId (pakai requestId)
      const memoId = ethers.hexlify(ethers.toUtf8Bytes(id));
      
      // 4. Encode memoData (deskripsi request)
      const memoData = ethers.hexlify(ethers.toUtf8Bytes(`Payment for: ${req.description} (${id.slice(0,8)})`));
      
      // 5. Panggil Memo.memo (bukan USDC.transfer langsung)
      const memoContract = new ethers.Contract(MEMO_ADDRESS, MEMO_ABI, signer);
      const tx = await memoContract.memo(
        USDC_ADDRESS,
        transferData,
        memoId,
        memoData,
        { gasLimit: 500000 }
      );
      
      const receipt = await tx.wait();
      const txHash = receipt.hash;
      setTxHashes(prev => ({ ...prev, [id]: txHash }));
      setPayId('');
      
      // 6. Update state
      await fetchMyRequests(); 
      await fetchMyPayments(); 
      await fetchBalance(); 
      await fetchUserStats();
      
      // 7. Cek badge
      if (SIMPLE_BADGE_ADDRESS !== '0x0000000000000000000000000000000000000000') {
        try {
          const badgeContract = new ethers.Contract(SIMPLE_BADGE_ADDRESS, SIMPLE_BADGE_ABI, signer);
          await badgeContract.updateStats(wallet, 0, Number(ethers.formatUnits(amountInWei, 18)), { gasLimit: 300000 });
          const hasFirstPayment = await badgeContract.hasBadge(wallet, 1);
          if (!hasFirstPayment) {
            setPendingBadge({ id: 1, name: 'First Payment' });
            setShowMintModal(true);
          }
        } catch (badgeError) { console.error("Badge award failed:", badgeError); }
      }
      
      // 8. Toast dengan info memo
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#10b981', '#06b6d4', '#f43f5e'] });
      const randomVibe = vibeQuestions[Math.floor(Math.random() * vibeQuestions.length)];
      showToast(`🎉 Payment sent with memo! ${randomVibe}`, 'success', txHash);
      
    } catch(e: any) {
      showToast(e.message?.slice(0,60), 'error');
    }
    setLoading('');
  }, [pendingPayId, wallet]);

  function copyToClipboard(text: string) { navigator.clipboard.writeText(text); showToast('📋 Copied!', 'success'); }
  function shareRequestLink(requestId: string) { const url = `${window.location.origin}/#reqId=${requestId}`; navigator.clipboard.writeText(url); showToast('🔗 Magic link copied!', 'success'); }
  function truncateHash(hash: string) { return `${hash.slice(0,6)}...${hash.slice(-6)}`; }
  function showToast(msg: string, type: 'success' | 'error', txHash?: string) { setToast({ msg, type, txHash }); setTimeout(() => setToast(null), 6000); }

  const filteredRequests = myRequests.filter(req => (req.description.toLowerCase().includes(searchTerm.toLowerCase()) || req.id.toLowerCase().includes(searchTerm.toLowerCase())) && (filterStatus === 'all' || (filterStatus === 'pending' && !req.paid) || (filterStatus === 'paid' && req.paid)));
  const paginatedRequests = filteredRequests.slice((requestsPage - 1) * itemsPerPage, requestsPage * itemsPerPage);
  const paginatedPayments = myPayments.slice((paymentsPage - 1) * itemsPerPage, paymentsPage * itemsPerPage);
  const todayBadgeId = new Date().getDay() % 7;

  const bgClass = darkMode ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-gray-100 via-white to-gray-100';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const cardBg = darkMode ? 'bg-white/5 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md';
  const borderClass = darkMode ? 'border-white/10' : 'border-gray-300/30';
  const inputBg = darkMode ? 'bg-black/50' : 'bg-white/80';
  const navBg = darkMode ? 'bg-black/30' : 'bg-white/30';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} font-sans relative overflow-x-hidden transition-all duration-500 animate-gradient`}>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-gradient { background-size: 200% 200%; animation: gradient 10s ease infinite; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .glow-text { text-shadow: 0 0 10px rgba(6, 182, 212, 0.5), 0 0 20px rgba(6, 182, 212, 0.3), 0 0 30px rgba(236, 72, 153, 0.2); }
      `}</style>

      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={executePay} title="Confirm Payment" message={`Pay for request ID: ${truncateHash(pendingPayId)}. Gas fee: ${gasEstimate || '~0.001 USDC'}.`} loading={loading === 'Processing payment...'} />
      <MintBadgeModal isOpen={showMintModal} onClose={() => { setShowMintModal(false); setPendingBadge(null); }} onMint={handleMintBadge} badgeName={pendingBadge?.name || ''} loading={loading === 'Minting badge...'} />

      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={() => setShowQRModal(false)}>
          <div className={`${cardBg} rounded-2xl p-6 max-w-sm w-full mx-4 border ${borderClass} text-center`} onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Scan to Pay</h3>
            <div className="bg-white p-4 rounded-xl inline-block mx-auto">
              <QRCode value={`${window.location.origin}/#reqId=${qrRequestId}`} size={200} />
            </div>
            <p className="text-xs text-gray-400 mt-4 break-all">{qrRequestId}</p>
            <button onClick={() => setShowQRModal(false)} className="mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:scale-105 transition">Close</button>
          </div>
        </div>
      )}

      {toast && (
        <div 
          className={`fixed bottom-5 left-5 z-50 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md text-base font-medium ${toast.type === 'success' ? 'bg-green-600/90' : 'bg-red-600/90'} text-white animate-fadeIn max-w-sm cursor-pointer hover:scale-105 transition-all`}
          onClick={() => { if (toast.txHash) window.open(`https://testnet.arcscan.app/tx/${toast.txHash}`, '_blank'); }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">{toast.type === 'success' ? '✅' : '❌'}</span>
            <span>{toast.msg}</span>
            {toast.txHash && <span className="text-xs underline ml-1 text-cyan-200">🔗 View on ArcScan</span>}
          </div>
        </div>
      )}

      <nav className={`relative z-20 border-b ${borderClass} ${navBg} backdrop-blur-xl sticky top-0 transition-all duration-300`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#logoGrad)"/>
              <text x="24" y="33" textAnchor="middle" fill="white" fontSize="26" fontWeight="900" fontFamily="Inter, sans-serif">A</text>
              <path d="M34 22L38 26L34 30" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M38 26H28" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899"/>
                  <stop offset="100%" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">ArcPay</span>
            <span className="text-[10px] font-mono text-gray-400 bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>Arc Testnet</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => setActiveTab('requests')} className={`text-sm transition hover:text-cyan-400 flex items-center gap-1 ${activeTab === 'requests' ? 'text-cyan-400' : 'text-gray-400'}`}><Layers className="w-3.5 h-3.5" /> Requests</button>
            <button onClick={() => setActiveTab('payments')} className={`text-sm transition hover:text-cyan-400 flex items-center gap-1 ${activeTab === 'payments' ? 'text-cyan-400' : 'text-gray-400'}`}><Send className="w-3.5 h-3.5" /> Payments</button>
            <button onClick={() => setActiveTab('badges')} className={`text-sm transition hover:text-cyan-400 flex items-center gap-1 ${activeTab === 'badges' ? 'text-cyan-400' : 'text-gray-400'}`}><Award className="w-3.5 h-3.5" /> Badges</button>
            <button onClick={() => setActiveTab('leaderboard')} className={`text-sm transition hover:text-cyan-400 flex items-center gap-1 ${activeTab === 'leaderboard' ? 'text-cyan-400' : 'text-gray-400'}`}><Trophy className="w-3.5 h-3.5" /> Leaderboard</button>
            <button onClick={() => setActiveTab('analytics')} className={`text-sm transition hover:text-cyan-400 flex items-center gap-1 ${activeTab === 'analytics' ? 'text-cyan-400' : 'text-gray-400'}`}><BarChart3 className="w-3.5 h-3.5" /> Analytics</button>
            <a href="https://faucet.circle.com" target="_blank" className="text-sm text-gray-400 hover:text-cyan-400 transition flex items-center gap-1"><Droplet className="w-3.5 h-3.5" /> Faucet</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center hover:scale-110">{darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
            <button onClick={() => setShowTutorial(true)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center hover:scale-110"><HelpCircle className="w-4 h-4" /></button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"><Menu className="w-4 h-4" /></button>
            {!wallet ? (
              <button onClick={connectWallet} disabled={isConnecting} className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-600 to-cyan-600 text-sm font-medium hover:scale-105 transition-all hover:shadow-lg hover:shadow-pink-500/30 disabled:opacity-50 flex items-center gap-2 active:scale-95">
                {isConnecting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Wallet className="w-4 h-4" /> Connect</>}
              </button>
            ) : (
              <div className="flex items-center gap-2 md:gap-3 bg-white/5 rounded-full border border-white/10 px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-mono text-sm hidden sm:inline">{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
                  <span className="text-xs bg-gradient-to-r from-pink-500/30 to-cyan-500/30 px-2 py-0.5 rounded-full">{parseFloat(balance).toFixed(2)} USDC</span>
                  <span className="hidden md:inline-flex text-xs bg-yellow-500/30 px-2 py-0.5 rounded-full items-center gap-1"><Award className="w-3 h-3" /> {totalBadges}</span>
                  <span className="hidden md:inline-flex text-xs bg-purple-500/30 px-2 py-0.5 rounded-full items-center gap-1"><Star className="w-3 h-3" /> {userPoints}</span>
                </div>
                <button onClick={disconnectWallet} className="text-gray-300 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition text-sm">🔌</button>
              </div>
            )}
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/50 backdrop-blur-md p-4 flex flex-col gap-3">
            <button onClick={() => { setActiveTab('requests'); setMobileMenuOpen(false); }} className={`text-sm transition hover:text-cyan-400 flex items-center gap-2 ${activeTab === 'requests' ? 'text-cyan-400' : 'text-gray-400'}`}><Layers className="w-4 h-4" /> Requests</button>
            <button onClick={() => { setActiveTab('payments'); setMobileMenuOpen(false); }} className={`text-sm transition hover:text-cyan-400 flex items-center gap-2 ${activeTab === 'payments' ? 'text-cyan-400' : 'text-gray-400'}`}><Send className="w-4 h-4" /> Payments</button>
            <button onClick={() => { setActiveTab('badges'); setMobileMenuOpen(false); }} className={`text-sm transition hover:text-cyan-400 flex items-center gap-2 ${activeTab === 'badges' ? 'text-cyan-400' : 'text-gray-400'}`}><Award className="w-4 h-4" /> Badges</button>
            <button onClick={() => { setActiveTab('leaderboard'); setMobileMenuOpen(false); }} className={`text-sm transition hover:text-cyan-400 flex items-center gap-2 ${activeTab === 'leaderboard' ? 'text-cyan-400' : 'text-gray-400'}`}><Trophy className="w-4 h-4" /> Leaderboard</button>
            <button onClick={() => { setActiveTab('analytics'); setMobileMenuOpen(false); }} className={`text-sm transition hover:text-cyan-400 flex items-center gap-2 ${activeTab === 'analytics' ? 'text-cyan-400' : 'text-gray-400'}`}><BarChart3 className="w-4 h-4" /> Analytics</button>
            <a href="https://faucet.circle.com" target="_blank" className="text-sm text-gray-400 hover:text-cyan-400 transition flex items-center gap-2"><Droplet className="w-4 h-4" /> Faucet</a>
            <button onClick={disconnectWallet} className="mt-2 w-full px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition flex items-center justify-center gap-2 text-sm font-medium">🔌 Disconnect Wallet</button>
          </div>
        )}
      </nav>

      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className={`${cardBg} rounded-2xl max-w-md w-full p-6 border ${borderClass}`}>
            <h3 className="text-2xl font-bold mb-3 text-center flex items-center justify-center gap-2"><Sparkles className="w-6 h-6 text-cyan-400" /> ArcPay Tutorial</h3>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2"><span className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center text-xs">0️⃣</span> <strong>Get USDC first</strong> – Use <a href="https://faucet.circle.com" target="_blank" className="text-cyan-400 underline">Circle Faucet</a> (select Arc Testnet)</p>
              <p className="flex items-center gap-2"><span className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center text-xs">1️⃣</span> <strong>Connect Wallet</strong> – Rabby/MetaMask on Arc Testnet</p>
              <p className="flex items-center gap-2"><span className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center text-xs">2️⃣</span> <strong>Create Request</strong> – Fill description & amount → Create</p>
              <p className="flex items-center gap-2"><span className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center text-xs">3️⃣</span> <strong>Share ID</strong> – Copy ID or click 🔗 Magic Link</p>
              <p className="flex items-center gap-2"><span className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center text-xs">4️⃣</span> <strong>Payer Pays</strong> – Paste ID or click link → Confirm → Pay</p>
              <p className="flex items-center gap-2"><span className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center text-xs">5️⃣</span> <strong>Done!</strong> – Status "Paid" & balance updates</p>
            </div>
            <p className="text-center text-cyan-400 text-xs mt-3 flex items-center justify-center gap-1"><Sparkles className="w-3 h-3" /> Happy building on Arc Testnet <Sparkles className="w-3 h-3" /></p>
            <button onClick={() => { setShowTutorial(false); localStorage.setItem('arcpay-tutorial', 'true'); }} className="mt-4 w-full py-2 rounded-xl bg-gradient-to-r from-pink-600 to-cyan-600 hover:scale-105 transition font-semibold">🚀 Got it!</button>
          </div>
        </div>
      )}

      <div className="relative z-10 text-center pt-10 pb-8 px-4"><h1 className="text-5xl sm:text-6xl font-black mb-3 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl flex items-center justify-center gap-2">USDC <span className="text-white/30 text-4xl">→</span> Payments</h1><p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Send and receive payment requests on Arc L1</p></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-8">
          <div className={`${cardBg} rounded-2xl p-6 border ${borderClass} transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-500/20`}>
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2"><Send className="w-5 h-5 text-pink-400" /> Create Request</h2>
            <div className="space-y-4">
              <input type="text" placeholder="What's it for? (e.g., 'Website design')" value={desc} onChange={(e) => setDesc(e.target.value)} className={`w-full ${inputBg} border ${borderClass} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 transition`} />
              <input type="number" placeholder="Amount (USDC)" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full ${inputBg} border ${borderClass} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 transition`} />
              <button onClick={createRequest} disabled={loading !== '' || !wallet} className="w-full py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-pink-600 to-purple-600 hover:scale-105 transition-all hover:shadow-lg hover:shadow-pink-500/30 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2">{loading === 'Creating request...' ? <><Zap className="w-4 h-4 animate-spin" /> Creating...</> : <><Sparkles className="w-4 h-4" /> Create Request</>}</button>
            </div>
          </div>
          <div className={`${cardBg} rounded-2xl p-6 border ${borderClass} transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20`}>
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2"><Send className="w-5 h-5 text-cyan-400" /> Pay Request</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Request ID (0x...)" value={payId} onChange={(e) => setPayId(e.target.value)} className={`w-full ${inputBg} border ${borderClass} rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-cyan-500 transition`} />
              {gasEstimate && <div className="text-xs text-gray-400 text-center">⛽ Estimated gas: {gasEstimate}</div>}
              <button onClick={handlePayClick} disabled={loading !== '' || !wallet} className="w-full py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-cyan-600 to-teal-600 hover:scale-105 transition-all hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2">{loading === 'Processing payment...' ? <><Zap className="w-4 h-4 animate-spin" /> Paying...</> : <><Send className="w-4 h-4" /> Pay Request</>}</button>
            </div>
          </div>
        </div>

        {wallet && (
          <div className={`mt-8 ${cardBg} rounded-2xl p-5 border ${borderClass} flex flex-wrap items-center justify-between gap-4`}>
            <div className="flex items-center gap-4">
              <div className={`text-4xl w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border border-yellow-500/30`}>{dailyBadgeIcons[todayBadgeId]}</div>
              <div>
                <div className="flex items-center gap-2"><h3 className="font-semibold">Daily Badge</h3>{dailyStreak > 0 && <span className="text-xs bg-orange-500/30 px-2 py-0.5 rounded-full flex items-center gap-1"><Flame className="w-3 h-3" /> {dailyStreak} day streak</span>}</div>
                <p className="text-xs text-gray-400">Mint 1 badge every day. Streak rewards at 7 days!</p>
              </div>
            </div>
            <button onClick={mintDailyBadge} disabled={!canMintToday || loading !== ''} className={`px-5 py-2 rounded-xl font-medium text-sm transition-all hover:scale-105 flex items-center gap-2 ${canMintToday ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg hover:shadow-yellow-500/30' : 'bg-gray-600/50 cursor-not-allowed'}`}>{canMintToday ? <><Gift className="w-4 h-4" /> Mint Today's Badge</> : <><CheckCircle className="w-4 h-4" /> Already Minted</>}</button>
          </div>
        )}

        {wallet && (
          <>
            <div className="flex gap-6 mt-10 border-b border-white/10 mb-6">
              <button onClick={() => setActiveTab('requests')} className={`pb-2 px-2 text-base transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}><Layers className="w-4 h-4" /> My Requests</button>
              <button onClick={() => setActiveTab('payments')} className={`pb-2 px-2 text-base transition-all flex items-center gap-2 ${activeTab === 'payments' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}><Send className="w-4 h-4" /> My Payments{myPayments.length > 0 && <button onClick={() => exportToCSV(myPayments, 'arcpay-payments')} className="ml-2 text-xs bg-cyan-600/50 hover:bg-cyan-600 px-2 py-0.5 rounded-full transition" title="Export CSV"><Download className="w-3 h-3 inline" /> CSV</button>}</button>
              <button onClick={() => setActiveTab('badges')} className={`pb-2 px-2 text-base transition-all flex items-center gap-2 ${activeTab === 'badges' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}><Award className="w-4 h-4" /> Badges{userBadgeCount > 0 && <span className="text-xs bg-cyan-500/30 px-1.5 py-0.5 rounded-full">{userBadgeCount}</span>}</button>
              <button onClick={() => setActiveTab('leaderboard')} className={`pb-2 px-2 text-base transition-all flex items-center gap-2 ${activeTab === 'leaderboard' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}><Trophy className="w-4 h-4" /> Leaderboard</button>
              <button onClick={() => setActiveTab('analytics')} className={`pb-2 px-2 text-base transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}><BarChart3 className="w-4 h-4" /> Analytics</button>
            </div>

            {activeTab === 'requests' && (
              <div className={`${cardBg} rounded-2xl p-6 border ${borderClass}`}>
                <div className="flex flex-wrap justify-between items-center mb-5 gap-3"><h2 className="text-xl font-semibold flex items-center gap-2"><Layers className="w-5 h-5 text-cyan-400" /> My Requests</h2><div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" /><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputBg} border ${borderClass} rounded-xl pl-8 pr-3 py-1.5 text-sm w-32 sm:w-40 focus:outline-none focus:border-cyan-500`} /></div><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className={`${inputBg} border ${borderClass} rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500`}><option value="all">All</option><option value="pending">Pending</option><option value="paid">Paid</option></select></div></div>
                {isFetching ? <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div> : paginatedRequests.length === 0 ? <div className="text-center py-12"><div className="text-6xl mb-3">📭</div><p className="text-gray-400">No requests yet</p><button onClick={() => setShowTutorial(true)} className="mt-3 text-xs text-cyan-400 hover:text-cyan-300">❓ Need help?</button></div> : <div className="space-y-3">{paginatedRequests.map((req, idx) => (<div key={idx} className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-white/20 transition-all hover:scale-[1.01]"><div className="flex flex-wrap justify-between items-start gap-2"><div className="flex-1"><p className="font-medium truncate">{req.description}</p><div className="flex flex-wrap items-center gap-2 mt-1"><p className="text-xs text-gray-400 font-mono">{truncateHash(req.id)}</p><button onClick={() => copyToClipboard(req.id)} className="bg-gray-700 hover:bg-cyan-600 px-2 py-1 rounded text-xs flex items-center gap-1 transition"><Copy className="w-3 h-3" /> Copy</button><button onClick={() => shareRequestLink(req.id)} className="bg-gray-700 hover:bg-green-600 px-2 py-1 rounded text-xs flex items-center gap-1 transition"><Share2 className="w-3 h-3" /> Share</button>
                          <button 
                            onClick={() => { 
                              console.log("QR clicked for:", req.id); 
                              setQrRequestId(req.id); 
                              setShowQRModal(true); 
                            }} 
                            className="bg-gray-700 hover:bg-purple-600 px-3 py-1.5 rounded text-xs flex items-center gap-1 transition font-medium"
                          >
                            📱 QR
                          </button>
                          {txHashes[req.id] && <a href={`https://testnet.arcscan.app/tx/${txHashes[req.id]}`} target="_blank" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Tx</a>}</div><p className="text-xs text-cyan-300 mt-1">{req.amount} USDC</p></div><span className={`text-xs px-3 py-1 rounded-full border ${req.paid ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>{req.paid ? <><CheckCircle className="w-3 h-3 inline mr-1" /> Paid</> : <><Clock className="w-3 h-3 inline mr-1" /> Pending</>}</span></div></div>))}<Pagination currentPage={requestsPage} totalPages={Math.ceil(filteredRequests.length / itemsPerPage)} onPageChange={setRequestsPage} /></div>}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className={`${cardBg} rounded-2xl p-6 border ${borderClass}`}>
                <h2 className="text-xl font-semibold mb-5 flex items-center gap-2"><Send className="w-5 h-5 text-cyan-400" /> My Payments</h2>
                {isFetchingPayments ? <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div> : paginatedPayments.length === 0 ? <div className="text-center py-12"><div className="text-6xl mb-3">💸</div><p className="text-gray-400">No payments yet</p></div> : <><div className="space-y-3">{paginatedPayments.map((payment, idx) => (<div key={idx} className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-white/20 transition-all hover:scale-[1.01]"><div className="flex flex-wrap justify-between items-start gap-2"><div className="flex-1"><p className="font-medium truncate">{payment.description}</p><p className="text-xs text-gray-400 font-mono mt-1">{truncateHash(payment.id)}</p><p className="text-xs text-cyan-300 mt-1">{payment.amount} USDC</p></div><span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span></div></div>))}</div><Pagination currentPage={paymentsPage} totalPages={Math.ceil(myPayments.length / itemsPerPage)} onPageChange={setPaymentsPage} /></>}
              </div>
            )}

            {activeTab === 'badges' && (
              <div className={`${cardBg} rounded-2xl p-6 border ${borderClass}`}>
                <h2 className="text-xl font-semibold mb-5 flex items-center gap-2"><Award className="w-5 h-5 text-cyan-400" /> Your Badges</h2>
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-cyan-400" /> How to Earn Badges</h3>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>🎯 First Request — Create your first payment request → Complete to unlock</p>
                    <p>💰 First Payment — Pay any request → Complete to unlock</p>
                    <p>🏆 10 Requests — Create 10 payment requests → Complete to unlock</p>
                    <p>🐋 100 USDC Paid — Pay total 100 USDC → Complete to unlock</p>
                    <p>🔥 7 Day Streak — Mint daily badge for 7 days straight → Complete to unlock</p>
                    <p>👑 Legend — Reach 2000 points → Complete to unlock</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl p-5 mb-6 border border-white/10">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div><p className="text-xs text-gray-400">Current Tier</p><p className="text-2xl font-bold flex items-center gap-2">{tierIcon} {tierName}</p></div>
                    <div><p className="text-xs text-gray-400">Total Badges</p><p className="text-2xl font-bold">{totalBadges}</p></div>
                    <div><p className="text-xs text-gray-400">Daily Streak</p><p className="text-2xl font-bold flex items-center gap-1"><Flame className="w-5 h-5 text-orange-500" /> {dailyStreak}</p></div>
                    <div><p className="text-xs text-gray-400">Points</p><p className="text-2xl font-bold flex items-center gap-1"><Star className="w-5 h-5 text-yellow-500" /> {userPoints}</p></div>
                  </div>
                </div>
                
                <div className="mb-6 p-4 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-xl border border-cyan-500/30">
                  <p className="text-sm font-medium mb-3 text-center">Need to claim your badge?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => checkAndMintBadge(0, 'First Request')} disabled={userBadges[0]} className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-600 to-green-600 hover:shadow-lg">🎯 First Request</button>
                    <button onClick={() => checkAndMintBadge(1, 'First Payment')} disabled={userBadges[1]} className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg">💰 First Payment</button>
                    <button onClick={() => checkAndMintBadge(2, '10 Requests')} disabled={userBadges[2]} className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg">🏆 10 Requests</button>
                    <button onClick={() => checkAndMintBadge(3, '100 USDC Paid')} disabled={userBadges[3]} className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-600 to-teal-600 hover:shadow-lg">🐋 100 USDC Paid</button>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-3">Click button to check & mint your badge (only once per badge)</p>
                </div>

                <h3 className="font-semibold mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" /> Achievements</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">{badgeConfig.map((badge, idx) => (<div key={idx} className={`text-center p-3 rounded-xl transition-all ${userBadges[idx] ? `${badge.color}/20 border border-${badge.color.split('-')[1]}-500/30` : 'bg-white/5 border border-white/10 opacity-50'}`}><div className={`text-3xl mb-1 ${userBadges[idx] ? 'animate-pulse' : ''}`}>{badge.icon}</div><p className="text-xs font-medium">{badge.name}</p><p className="text-[10px] text-gray-500 mt-1">{userBadges[idx] ? '✅ Unlocked' : '🔒 Locked'}</p></div>))}</div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Gift className="w-4 h-4 text-yellow-500" /> Daily Badges</h3>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">{dailyBadgeIcons.map((icon, idx) => (<div key={idx} className="text-center p-2 rounded-lg bg-white/5 border border-white/10"><div className="text-2xl">{icon}</div><p className="text-[10px] mt-1">{dailyBadgeNames[idx]}</p></div>))}</div>
                <p className="text-center text-xs text-cyan-400 mt-4">✨ Mint a badge every day to increase your streak! ✨</p>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className={`${cardBg} rounded-2xl p-6 border ${borderClass}`}>
                <h2 className="text-xl font-semibold mb-5 flex-items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Leaderboard</h2>
                <div className="space-y-2">
                  {leaderboard.map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-500/30 text-yellow-400' : idx === 1 ? 'bg-gray-400/30 text-gray-300' : idx === 2 ? 'bg-orange-500/30 text-orange-400' : 'bg-white/10'}`}>{idx + 1}</span>
                        <span className="font-mono text-sm">{user.address}</span>
                      </div>
                      <div className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /><span className="font-semibold">{user.points}</span></div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-gray-500 mt-4">✨ Keep building to climb the ranks! ✨</p>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className={`${cardBg} rounded-2xl p-6 border ${borderClass}`}>
                <h2 className="text-xl font-semibold mb-5 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-cyan-400" /> Analytics Dashboard</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold">{totalRequests}</p>
                    <p className="text-xs text-gray-400">Total Requests</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold">{totalPayments}</p>
                    <p className="text-xs text-gray-400">Total Payments</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold">{totalVolume.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Volume (USDC)</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold">{userPoints}</p>
                    <p className="text-xs text-gray-400">Total Points</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Request Status</h3>
                    <div className="flex justify-between text-sm mb-2"><span>Pending</span><span>{pendingRequests}</span></div>
                    <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${totalRequests ? (pendingRequests / totalRequests) * 100 : 0}%` }}></div>
                    </div>
                    <div className="flex justify-between text-sm mb-2"><span>Paid</span><span>{paidRequests}</span></div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${totalRequests ? (paidRequests / totalRequests) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-purple-400" /> Badge Progress</h3>
                    <div className="text-center mb-2">
                      <p className="text-3xl font-bold">{userBadgeCount}/6</p>
                      <p className="text-xs text-gray-400">Badges Collected</p>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: `${badgeProgress}%` }}></div>
                    </div>
                    <p className="text-xs text-center mt-2 text-gray-400">{Math.round(badgeProgress)}% Complete</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl p-4">
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div><p className="text-xs text-gray-400">Current Streak</p><p className="text-xl font-bold flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500" /> {dailyStreak} days</p></div>
                    <div><p className="text-xs text-gray-400">Tier</p><p className="text-xl font-bold">{tierIcon} {tierName}</p></div>
                    <div><p className="text-xs text-gray-400">Next Badge</p><p className="text-sm font-medium">{nextBadgeName}</p></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-12 p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center"><h3 className="text-sm font-semibold mb-2 flex-items-center justify-center gap-2"><BookOpen className="w-4 h-4 text-cyan-400" /> Quick Tutorial</h3><div className="text-xs text-gray-400 space-x-3 flex flex-wrap justify-center gap-y-2"><span>0️⃣ Get USDC first</span><span>➡️</span><span>1️⃣ Connect</span><span>➡️</span><span>2️⃣ Create</span><span>➡️</span><span>3️⃣ Share ID</span><span>➡️</span><span>4️⃣ Pay</span><span>➡️</span><span>5️⃣ Done ✅</span></div><p className="text-[10px] text-gray-500 mt-2 flex items-center justify-center gap-1">💰 Need USDC? Get from <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline flex items-center gap-1"><Droplet className="w-3 h-3" /> Circle Faucet</a> (select Arc Testnet)</p><p className="text-[10px] text-gray-500 mt-1 flex items-center justify-center gap-1">❓ Click the <HelpCircle className="w-3 h-3" /> button for full tutorial</p></div>

        <div className="text-center mt-10 pt-6 border-t border-white/10">
          <p className="text-sm font-medium glow-text bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent animate-pulse flex items-center justify-center gap-2">✦ Built on Arc | Integrated with USDC ✦</p>
          <div className="flex justify-center gap-4 mt-3 flex-wrap"><a href="https://github.com/mrpseudonym404/arcpay" target="_blank" rel="noopener noreferrer" className="text-gray-500 text-xs hover:text-cyan-400 transition">GitHub</a><a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 text-xs hover:text-cyan-400 transition flex items-center gap-1"><X className="w-3 h-3" /> Twitter</a><a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 text-xs hover:text-cyan-400 transition flex items-center gap-1"><Droplet className="w-3 h-3" /> Faucet</a></div>
          <div className="flex justify-center gap-4 mt-2 text-[10px] text-gray-600"><a href="/privacy" className="hover:text-cyan-400 transition">Privacy</a><span>•</span><a href="/terms" className="hover:text-cyan-400 transition">Terms</a><span>•</span><a href="/cookies" className="hover:text-cyan-400 transition">Cookies</a></div>
          <p className="text-gray-500 text-[10px] font-mono mt-2">arcpay · <a href={`https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition">{CONTRACT_ADDRESS.slice(0,8)}...{CONTRACT_ADDRESS.slice(-6)}</a></p>
        </div>
      </div>
    </div>
  );
}
