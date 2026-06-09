'use client';
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
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
const ARC_CHAIN_ID = '0x4CEF52';
const SIMPLE_BADGE_ADDRESS = '0x96d5646848424FdB50F19d23BEE7C2E56d033205';
const DAILY_BADGE_CONTRACT_ADDRESS = '0xA9323D36E49aC6aC49F38aAd431f4C2b69280475';

// ✅ PERBAIKAN: ABI lebih eksplisit
const CONTRACT_ABI = [
  'function createRequest(string description, uint256 amount) returns (bytes32)',
  'function payRequest(bytes32 id) external payable',
  'function getRequests(address user) view returns (bytes32[])',
  'function requests(bytes32) view returns (address creator, string description, uint256 amount, bool paid)',
  'function getPayerHistoryWithDetails(address payer) view returns (bytes32[], uint256[], string[], bool[])'
];

// ✅ PERBAIKAN: updateStats dengan parameter yang jelas
const SIMPLE_BADGE_ABI = [
  'function updateStats(uint256 requestCount, uint256 totalPaid) external',
  'function updateStreak() external',
  'function checkEligibility(uint8 badgeId) view returns (bool)',
  'function mintBadge(uint8 badgeId) external',
  'function hasBadge(address user, uint8 badgeId) view returns (bool)',
  'function getPoints(address user) view returns (uint256)',
  'function getUserStats(address user) view returns (uint256, uint256, uint256, uint256)'
];

const DAILY_BADGE_ABI = [
  'function mintDailyBadge() external',
  'function canMintToday(address user) view returns (bool)',
  'function totalBadges(address user) view returns (uint256)',
  'function mintStreak(address user) view returns (uint256)',
  'function getTierInfo(uint256 count) view returns (string, string)'
];

const USDC_ABI = [
  'function decimals() view returns (uint8)',
  'function balanceOf(address account) view returns (uint256)'
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
        <p className="text-gray-400 text-sm text-center mb-6">Mint this badge to add it to your collection and earn points.</p>
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
  const [activeTab, setActiveTab] = useState<'requests' | 'payments' | 'badges' | 'leaderboard'>('requests');
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
  const itemsPerPage = 5;

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
    if (wallet) { fetchBalance(); fetchMyRequests(); fetchMyPayments(); fetchUserStats(); fetchLeaderboard(); fetchDailyBadgeStatus(); fetchTierInfo(); }
  }, [wallet]);

  // ✅ PERBAIKAN: Gas estimation pakai amount request yang benar
  useEffect(() => {
    async function updateGasEstimate() {
      if (payId && wallet) {
        try {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
          const req = await contract.requests(payId);
          const gasPrice = await provider.getFeeData();
          const estimate = await contract.payRequest.estimateGas(payId, { value: req.amount });
          const gasCostWei = estimate * (gasPrice.gasPrice || 0n);
          const gasCostUsdc = Number(ethers.formatUnits(gasCostWei, 18));
          setGasEstimate(gasCostUsdc.toFixed(6));
        } catch (err) {
          setGasEstimate('N/A');
        }
      } else {
        setGasEstimate(null);
      }
    }
    updateGasEstimate();
  }, [payId, wallet]);

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

  async function fetchTierInfo() {
    if (!wallet || DAILY_BADGE_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const badgeContract = new ethers.Contract(DAILY_BADGE_CONTRACT_ADDRESS, DAILY_BADGE_ABI, provider);
      const total = await badgeContract.totalBadges(wallet);
      const [name, icon] = await badgeContract.getTierInfo(Number(total));
      setTierName(name); setTierIcon(icon);
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
      await fetchDailyBadgeStatus(); await fetchTierInfo();
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

  // ✅ PERBAIKAN: Leaderboard tetap dummy tapi dikasih tau (opsional)
  async function fetchLeaderboard() {
    // Catatan: Ini masih dummy karena kontrak tidak menyediakan fungsi getLeaderboard
    // Untuk production, perlu tambahkan fungsi di smart contract
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
        try { await badgeContract.updateStreak(); } catch(e) {}
      }
      await fetchDailyBadgeStatus(); await fetchTierInfo();
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
      await fetchTierInfo();
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
          // ✅ PERBAIKAN: Pakai integer 0 untuk totalPaid
          await badgeContract.updateStats(1, 0, { gasLimit: 500000 });
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
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const req = await contract.requests(id);
      const amountInWei = req.amount;
      const tx = await contract.payRequest(id, { value: amountInWei, gasLimit: 500000 });
      const receipt = await tx.wait();
      const txHash = receipt.hash;
      setTxHashes(prev => ({ ...prev, [id]: txHash }));
      setPayId('');
      await fetchMyRequests(); await fetchMyPayments(); await fetchBalance(); await fetchUserStats();
      
      if (SIMPLE_BADGE_ADDRESS !== '0x0000000000000000000000000000000000000000') {
        try {
          const badgeContract = new ethers.Contract(SIMPLE_BADGE_ADDRESS, SIMPLE_BADGE_ABI, signer);
          // ✅ PERBAIKAN: Pakai amountInWei (integer), BUKAN float!
          await badgeContract.updateStats(0, amountInWei, { gasLimit: 500000 });
          const hasFirstPayment = await badgeContract.hasBadge(wallet, 1);
          if (!hasFirstPayment) {
            setPendingBadge({ id: 1, name: 'First Payment' });
            setShowMintModal(true);
          }
        } catch (badgeError) { console.error("Badge award failed:", badgeError); }
      }
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#10b981', '#06b6d4', '#f43f5e'] });
      const randomVibe = vibeQuestions[Math.floor(Math.random() * vibeQuestions.length)];
      showToast(`🎉 Payment sent. ${randomVibe}`, 'success', txHash);
    } catch(e: any) { showToast(e.message?.slice(0,60), 'error'); }
    setLoading('');
  }, [pendingPayId, wallet]);

  function copyToClipboard(text: string) { navigator.clipboard.writeText(text); showToast('📋 Copied!', 'success'); }
  function shareRequestLink(requestId: string) { const url = `${window.location.origin}/#reqId=${requestId}`; navigator.clipboard.writeText(url); showToast('🔗 Magic link copied!', 'success'); }
  function truncateHash(hash: string) { return `${hash.slice(0,6)}...${hash.slice(-6)}`; }
  function showToast(msg: string, type: 'success' | 'error', txHash?: string) { setToast({ msg, type, txHash }); setTimeout(() => setToast(null), 6000); }

  const filteredRequests = myRequests.filter(req => (req.description.toLowerCase().includes(searchTerm.toLowerCase()) || req.id.toLowerCase().includes(searchTerm.toLowerCase())) && (filterStatus === 'all' || (filterStatus === 'pending' && !req.paid) || (filterStatus === 'paid' && req.paid)));
  const paginatedRequests = filteredRequests.slice((requestsPage - 1) * itemsPerPage, requestsPage * itemsPerPage);
  const paginatedPayments = myPayments.slice((paymentsPage - 1) * itemsPerPage, paymentsPage * itemsPerPage);
  const userBadgeCount = userBadges.filter(b => b).length;
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

      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={executePay} title="Confirm Payment" message={`Pay for request ID: ${truncateHash(pendingPayId)}. Estimated gas fee: ${gasEstimate || '~0.001'} USDC`} loading={loading === 'Processing payment...'} />
      <MintBadgeModal isOpen={showMintModal} onClose={() => { setShowMintModal(false); setPendingBadge(null); }} onMint={handleMintBadge} badgeName={pendingBadge?.name || ''} loading={loading === 'Minting badge...'} />

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
          <div className="flex items-center gap-2"><div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-lg shadow-lg animate-pulse"></div><span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">ArcPay</span><span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded">v4</span></div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all">{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
            {!wallet ? <button onClick={connectWallet} disabled={isConnecting} className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:shadow-lg transition-all text-sm font-medium flex items-center gap-2"><Wallet className="w-4 h-4" />{isConnecting ? 'Connecting...' : 'Connect Wallet'}</button> : <button onClick={disconnectWallet} className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-sm">Disconnect</button>}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {wallet ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className={`${cardBg} rounded-2xl p-5 border ${borderClass} backdrop-blur-md shadow-xl`}>
                <div className="flex items-center gap-3 mb-2"><Wallet className="w-5 h-5 text-cyan-400" /><span className="text-sm uppercase tracking-wider opacity-70">Wallet</span></div>
                <p className="font-mono text-sm break-all">{wallet.slice(0,8)}...{wallet.slice(-6)}</p>
                <div className="mt-3 flex items-center gap-2 text-2xl font-bold"><Droplet className="w-6 h-6 text-cyan-400" />{balance} USDC</div>
              </div>
              <div className={`${cardBg} rounded-2xl p-5 border ${borderClass} backdrop-blur-md shadow-xl`}>
                <div className="flex items-center gap-3 mb-2"><Award className="w-5 h-5 text-purple-400" /><span className="text-sm uppercase tracking-wider opacity-70">Badges & Points</span></div>
                <div className="flex justify-between items-center"><span className="text-2xl font-bold">{userPoints} pts</span><span className="text-sm">{userBadgeCount}/6 badges</span></div>
                <div className="mt-2 text-sm opacity-70">{tierIcon} {tierName}</div>
              </div>
              <div className={`${cardBg} rounded-2xl p-5 border ${borderClass} backdrop-blur-md shadow-xl`}>
                <div className="flex items-center gap-3 mb-2"><Flame className="w-5 h-5 text-orange-400" /><span className="text-sm uppercase tracking-wider opacity-70">Daily Streak</span></div>
                <div className="flex justify-between items-center"><span className="text-2xl font-bold">{dailyStreak} days</span>{canMintToday ? <button onClick={mintDailyBadge} className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-xs">Mint Daily</button> : <span className="text-xs opacity-50">Minted</span>}</div>
              </div>
            </div>

            <div className="flex gap-2 border-b border-white/20 mb-6">
              {(['requests', 'payments', 'badges', 'leaderboard'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === tab ? 'border-b-2 border-cyan-400 text-cyan-400' : 'opacity-60 hover:opacity-100'}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
              ))}
            </div>

            {activeTab === 'requests' && (
              <div className="space-y-8">
                <div className={`${cardBg} rounded-2xl p-6 border ${borderClass}`}>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-cyan-400" /> Create Request</h2>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input type="text" placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className={`flex-1 px-4 py-2 rounded-xl ${inputBg} border ${borderClass} outline-none focus:ring-2 focus:ring-cyan-500`} />
                    <input type="number" placeholder="Amount (USDC)" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-32 px-4 py-2 rounded-xl ${inputBg} border ${borderClass} outline-none focus:ring-2 focus:ring-cyan-500`} />
                    <button onClick={createRequest} disabled={!!loading} className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:shadow-lg transition-all flex items-center gap-2"><Zap className="w-4 h-4" /> Create</button>
                  </div>
                </div>

                <div className={`${cardBg} rounded-2xl p-6 border ${borderClass}`}>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Search className="w-5 h-5" /> My Requests</h2>
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <input type="text" placeholder="Search by description or ID" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`flex-1 px-4 py-2 rounded-xl ${inputBg} border ${borderClass}`} />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className={`px-4 py-2 rounded-xl ${inputBg} border ${borderClass}`}><option value="all">All</option><option value="pending">Pending</option><option value="paid">Paid</option></select>
                    <button onClick={() => exportToCSV(filteredRequests, 'arcpay-requests')} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 flex items-center gap-2"><Download className="w-4 h-4" /> Export</button>
                  </div>
                  {isFetching ? <Skeleton className="h-32" /> : paginatedRequests.length === 0 ? <p className="text-center opacity-50 py-8">No requests found</p> : paginatedRequests.map(req => (<div key={req.id} className={`border-b ${borderClass} py-3 last:border-0`}><div className="flex flex-wrap justify-between items-start gap-2"><div><p className="font-medium">{req.description}</p><p className="text-xs font-mono opacity-50">{req.id.slice(0,10)}...{req.id.slice(-8)}</p></div><div className="text-right"><p className="text-lg font-bold">{req.amount} USDC</p><p className={`text-xs ${req.paid ? 'text-green-400' : 'text-yellow-400'}`}>{req.paid ? 'Paid' : 'Pending'}</p><div className="flex gap-2 mt-1"><button onClick={() => copyToClipboard(req.id)} className="text-xs bg-white/10 px-2 py-0.5 rounded">Copy ID</button><button onClick={() => shareRequestLink(req.id)} className="text-xs bg-white/10 px-2 py-0.5 rounded">Share</button></div></div></div></div>))}
                  <Pagination currentPage={requestsPage} totalPages={Math.ceil(filteredRequests.length / itemsPerPage)} onPageChange={setRequestsPage} />
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className={`${cardBg} rounded-2xl p-6 border ${borderClass}`}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-teal-400" /> Pay Request</h2>
                <div className="flex gap-3 mb-6">
                  <input type="text" placeholder="Request ID (0x...)" value={payId} onChange={(e) => setPayId(e.target.value)} className={`flex-1 px-4 py-2 rounded-xl ${inputBg} border ${borderClass}`} />
                  <button onClick={handlePayClick} disabled={!!loading} className="px-6 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:shadow-lg transition-all">Pay</button>
                </div>
                <h3 className="font-bold mb-3">Payment History</h3>
                {isFetchingPayments ? <Skeleton className="h-32" /> : paginatedPayments.length === 0 ? <p className="text-center opacity-50 py-8">No payments made</p> : paginatedPayments.map(p => (<div key={p.id} className={`border-b ${borderClass} py-3 last:border-0`}><p className="font-medium">{p.description}</p><p className="text-xs font-mono opacity-50">{p.id}</p><p className="text-sm text-teal-400">{p.amount} USDC</p></div>))}
                <Pagination currentPage={paymentsPage} totalPages={Math.ceil(myPayments.length / itemsPerPage)} onPageChange={setPaymentsPage} />
              </div>
            )}

            {activeTab === 'badges' && (
              <div className="space-y-6">
                <div className={`${cardBg} rounded-2xl p-6 border ${borderClass}`}>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-purple-400" /> Achievement Badges</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {badgeConfig.map(badge => (
                      <div key={badge.id} onClick={() => checkAndMintBadge(badge.id, badge.name)} className={`p-4 rounded-xl text-center cursor-pointer transition-all hover:scale-105 ${userBadges[badge.id] ? `${badge.color} bg-opacity-20 border border-${badge.color}` : 'bg-white/5 border border-white/10'}`}>
                        <div className="text-3xl mb-1">{badge.icon}</div>
                        <div className="font-bold text-sm">{badge.name}</div>
                        <div className="text-xs opacity-60 mt-1">{userBadges[badge.id] ? 'Minted ✓' : 'Locked'}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`${cardBg} rounded-2xl p-6 border ${borderClass}`}>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Gem className="w-5 h-5 text-amber-400" /> Daily Badges</h2>
                  <div className="flex justify-between items-center flex-wrap gap-3"><div className="flex items-center gap-2"><span className="text-3xl">{dailyBadgeIcons[todayBadgeId]}</span><div><p className="font-bold">Today's Badge: {dailyBadgeNames[todayBadgeId]}</p><p className="text-xs opacity-60">Streak: {dailyStreak} days</p></div></div><button onClick={mintDailyBadge} disabled={!canMintToday} className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 disabled:opacity-50">Mint Today</button></div>
                </div>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className={`${cardBg} rounded-2xl p-6 border ${borderClass}`}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-400" /> Leaderboard</h2>
                <p className="text-xs text-center opacity-50 mb-4">⚠️ Demo data - Connect to real contract for live rankings</p>
                {leaderboard.map((user, idx) => (<div key={idx} className="flex justify-between items-center border-b border-white/10 py-2"><span className="flex items-center gap-2"><span className="w-6 text-center font-bold">{idx+1}</span><span className="font-mono text-sm">{user.address}</span></span><span className="font-bold">{user.points} pts</span></div>))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-6xl mb-6">🚀</div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">ArcPay</h1>
            <p className="text-lg opacity-70 mb-8">Payment Request on Arc Testnet</p>
            <button onClick={connectWallet} className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-lg font-medium flex items-center gap-2"><Wallet className="w-5 h-5" /> Connect Wallet to Start</button>
          </div>
        )}
      </main>
    </div>
  );
}
