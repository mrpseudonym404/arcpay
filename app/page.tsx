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
  BarChart3, User, Gem, Medal, BadgeCheck, QrCode, 
  Calendar, Repeat, Split, TrendingUp as TrendingIcon
} from 'lucide-react';

const CONTRACT_ADDRESS = '0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
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
  'function checkEligibility(address, uint8) view returns (bool)',
  'function mintBadge(uint8)',
  'function hasBadge(address, uint8) view returns (bool)',
  'function getPoints(address) view returns (uint256)',
  'function getUserStats(address) view returns (uint256, uint256, uint256, uint256, uint256)',
  'function getTierInfo(uint256) view returns (string, string)'
];

const DAILY_BADGE_ABI = [
  'function mintDailyBadge() external',
  'function canMintToday(address) view returns (bool)',
  'function totalBadges(address) view returns (uint256)',
  'function mintStreak(address) view returns (uint256)',
  'function getTierInfo(uint256) view returns (string, string)'
];

const USDC_ABI = [
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)'
];

const badgeConfig = [
  { id: 0, name: 'First Request', icon: '🎯', color: 'emerald' },
  { id: 1, name: 'First Payment', icon: '💰', color: 'blue' },
  { id: 2, name: '10 Requests', icon: '🏆', color: 'purple' },
  { id: 3, name: '100 USDC Paid', icon: '🐋', color: 'cyan' },
  { id: 4, name: '7 Day Streak', icon: '🔥', color: 'orange' },
  { id: 5, name: 'Legend', icon: '👑', color: 'yellow' }
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
        showToast('Magic link loaded!', 'success');
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

  async function fetchTierInfo() {
    if (!wallet || SIMPLE_BADGE_ADDRESS === '0x0000000000000000000000000000000000000000') return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const badgeContract = new ethers.Contract(SIMPLE_BADGE_ADDRESS, SIMPLE_BADGE_ABI, provider);
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
      showToast('Daily badge minted! Come back tomorrow for another one!', 'success');
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
      
      await fetchUserStats();
      await fetchDailyBadgeStatus();
      await fetchTierInfo();
      
      setShowMintModal(false);
      setPendingBadge(null);
      showToast(`${pendingBadge.name} badge minted!`, 'success');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch(e: any) {
      showToast(e.message?.slice(0,60), 'error');
    }
    setLoading('');
  };

  const checkAndMintBadge = async (badgeId: number, badgeName: string) => {
    if (userBadges[badgeId]) {
      showToast(`${badgeName} badge already minted!`, 'success');
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
        showToast(`${badgeName} badge already minted!`, 'success');
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
      
      try {
        const badgeContract = new ethers.Contract(SIMPLE_BADGE_ADDRESS, SIMPLE_BADGE_ABI, signer);
        const isEligible = await badgeContract.checkEligibility(wallet, 0);
        const hasBadge = await badgeContract.hasBadge(wallet, 0);
        if (isEligible && !hasBadge) {
          setPendingBadge({ id: 0, name: 'First Request' });
          setShowMintModal(true);
        }
      } catch (badgeError) { console.error("Badge check failed:", badgeError); }
      
      const randomVibe = vibeQuestions[Math.floor(Math.random() * vibeQuestions.length)];
      showToast(`Request created. ${randomVibe}`, 'success', txHash);
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
      
      try {
        const badgeContract = new ethers.Contract(SIMPLE_BADGE_ADDRESS, SIMPLE_BADGE_ABI, signer);
        const isEligible = await badgeContract.checkEligibility(wallet, 1);
        const hasBadge = await badgeContract.hasBadge(wallet, 1);
        if (isEligible && !hasBadge) {
          setPendingBadge({ id: 1, name: 'First Payment' });
          setShowMintModal(true);
        }
      } catch (badgeError) { console.error("Badge check failed:", badgeError); }
      
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#10b981', '#06b6d4', '#f43f5e'] });
      const randomVibe = vibeQuestions[Math.floor(Math.random() * vibeQuestions.length)];
      showToast(`Payment sent. ${randomVibe}`, 'success', txHash);
    } catch(e: any) { showToast(e.message?.slice(0,60), 'error'); }
    setLoading('');
  }, [pendingPayId, wallet]);

  function copyToClipboard(text: string) { navigator.clipboard.writeText(text); showToast('Copied!', 'success'); }
  function shareRequestLink(requestId: string) { const url = `${window.location.origin}/#reqId=${requestId}`; navigator.clipboard.writeText(url); showToast('Magic link copied!', 'success'); }
  function truncateHash(hash: string) { return `${hash.slice(0,6)}...${hash.slice(-6)}`; }
  function showToast(msg: string, type: 'success' | 'error', txHash?: string) { setToast({ msg, type, txHash }); setTimeout(() => setToast(null), 6000); }

  // Hitung statistik untuk analytics
  const totalRequests = myRequests.length;
  const totalPayments = myPayments.length;
  const totalVolume = myPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const pendingRequests = myRequests.filter(r => !r.paid).length;
  const paidRequests = myRequests.filter(r => r.paid).length;
  const badgeProgress = (userBadges.filter(b => b).length / 6) * 100;

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

  // Mobile navigation handler yang benar
  const handleMobileNav = (tab: 'requests' | 'payments' | 'badges' | 'leaderboard' | 'analytics') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} font-sans relative overflow-x-hidden transition-all duration-500 animate-gradient`}>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes glow { 0% { box-shadow: 0 0 5px rgba(6,182,212,0.3); } 100% { box-shadow: 0 0 20px rgba(6,182,212,0.6); } }
        .animate-gradient { background-size: 200% 200%; animation: gradient 10s ease infinite; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .glow-text { text-shadow: 0 0 10px rgba(6,182,212,0.5), 0 0 20px rgba(6,182,212,0.3); }
        .card-hover:hover { transform: translateY(-4px); transition: all 0.3s ease; box-shadow: 0 20px 40px -12px rgba(0,0,0,0.3); }
        .gradient-border { border-image: linear-gradient(135deg, #06b6d4, #ec4899) 1; }
      `}</style>

      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={executePay} title="Confirm Payment" message={`Pay for request ID: ${truncateHash(pendingPayId)}. Gas fee: ${gasEstimate || '~0.001 USDC'}.`} loading={loading === 'Processing payment...'} />
      <MintBadgeModal isOpen={showMintModal} onClose={() => { setShowMintModal(false); setPendingBadge(null); }} onMint={handleMintBadge} badgeName={pendingBadge?.name || ''} loading={loading === 'Minting badge...'} />

      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={() => setShowQRModal(false)}>
          <div className={`${cardBg} rounded-2xl p-6 max-w-sm w-full mx-4 border ${borderClass} text-center`} onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Scan to Pay</h3>
            <div className="bg-white p-4 rounded-xl inline-block mx-auto">
              <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin}/#reqId=${qrRequestId)`} alt="QR Code" className="w-48 h-48" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 break-all">{qrRequestId}</p>
            <button onClick={() => setShowQRModal(false)} className="mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500">Close</button>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-5 left-5 z-50 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md text-sm font-medium ${toast.type === 'success' ? 'bg-green-600/90' : 'bg-red-600/90'} text-white animate-fadeIn max-w-sm cursor-pointer hover:scale-105 transition-all`} onClick={() => { if (toast.txHash) window.open(`https://testnet.arcscan.app/tx/${toast.txHash}`, '_blank'); }}>
          <div className="flex items-center gap-2 flex-wrap">{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>
        </div>
      )}

      <nav className={`relative z-20 border-b ${borderClass} ${navBg} backdrop-blur-xl sticky top-0 transition-all duration-300`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-lg shadow-lg animate-pulse"></div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">ArcPay</span>
            <span className="text-xs font-mono text-gray-400 bg-white/10 px-2 py-0.5 rounded-full hidden sm:inline-flex"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block mr-1"></span>Arc Testnet</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {['requests', 'payments', 'badges', 'leaderboard', 'analytics'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/10 ${activeTab === tab ? 'bg-gradient-to-r from-cyan-500/20 to-pink-500/20 text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
            <a href="https://faucet.circle.com" target="_blank" className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-all">Faucet</a>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center">{darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
            <button onClick={() => setShowTutorial(true)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"><HelpCircle className="w-4 h-4" /></button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"><Menu className="w-4 h-4" /></button>
            
            {!wallet ? (
              <button onClick={connectWallet} disabled={isConnecting} className="px-5 py-2 rounded-full bg-gradient-to-r from-pink-600 to-cyan-600 text-sm font-medium hover:scale-105 transition-all hover:shadow-lg hover:shadow-pink-500/30 disabled:opacity-50 flex items-center gap-2">
                {isConnecting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Wallet className="w-4 h-4" /> Connect</>}
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-white/5 rounded-full border border-white/10 px-3 py-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-mono text-sm hidden sm:inline">{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
                <span className="text-xs bg-gradient-to-r from-pink-500/30 to-cyan-500/30 px-2 py-0.5 rounded-full">{parseFloat(balance).toFixed(2)} USDC</span>
                <button onClick={disconnectWallet} className="text-gray-300 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10">🔌</button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu - FIXED */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl p-4 flex flex-col gap-2 animate-fadeIn">
            <button onClick={() => handleMobileNav('requests')} className={`px-4 py-3 rounded-xl text-left transition-all ${activeTab === 'requests' ? 'bg-gradient-to-r from-cyan-500/20 to-pink-500/20 text-cyan-400' : 'text-gray-300 hover:bg-white/10'}`}>📋 Requests</button>
            <button onClick={() => handleMobileNav('payments')} className={`px-4 py-3 rounded-xl text-left transition-all ${activeTab === 'payments' ? 'bg-gradient-to-r from-cyan-500/20 to-pink-500/20 text-cyan-400' : 'text-gray-300 hover:bg-white/10'}`}>💸 Payments</button>
            <button onClick={() => handleMobileNav('badges')} className={`px-4 py-3 rounded-xl text-left transition-all ${activeTab === 'badges' ? 'bg-gradient-to-r from-cyan-500/20 to-pink-500/20 text-cyan-400' : 'text-gray-300 hover:bg-white/10'}`}>🏆 Badges</button>
            <button onClick={() => handleMobileNav('leaderboard')} className={`px-4 py-3 rounded-xl text-left transition-all ${activeTab === 'leaderboard' ? 'bg-gradient-to-r from-cyan-500/20 to-pink-500/20 text-cyan-400' : 'text-gray-300 hover:bg-white/10'}`}>📊 Leaderboard</button>
            <button onClick={() => handleMobileNav('analytics')} className={`px-4 py-3 rounded-xl text-left transition-all ${activeTab === 'analytics' ? 'bg-gradient-to-r from-cyan-500/20 to-pink-500/20 text-cyan-400' : 'text-gray-300 hover:bg-white/10'}`}>📈 Analytics</button>
            <a href="https://faucet.circle.com" target="_blank" className="px-4 py-3 rounded-xl text-gray-300 hover:bg-white/10 transition-all">💧 Faucet</a>
            <button onClick={disconnectWallet} className="mt-2 px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all text-left">🔌 Disconnect Wallet</button>
          </div>
        )}
      </nav>

      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className={`${cardBg} rounded-2xl max-w-md w-full p-6 border ${borderClass}`}>
            <h3 className="text-2xl font-bold mb-3 text-center">ArcPay Tutorial</h3>
            <div className="space-y-3 text-sm">
              <p>0️⃣ Get USDC from faucet.circle.com</p>
              <p>1️⃣ Connect Wallet (Rabby/MetaMask)</p>
              <p>2️⃣ Create Request with description & amount</p>
              <p>3️⃣ Share ID or Magic Link</p>
              <p>4️⃣ Payer pays via ID or link</p>
              <p>5️⃣ Done! Status updates automatically</p>
            </div>
            <button onClick={() => { setShowTutorial(false); localStorage.setItem('arcpay-tutorial', 'true'); }} className="mt-4 w-full py-2 rounded-xl bg-gradient-to-r from-pink-600 to-cyan-600 hover:scale-105 transition font-semibold">Got it!</button>
          </div>
        </div>
      )}

      <div className="relative z-10 text-center pt-10 pb-8 px-4">
        <h1 className="text-5xl sm:text-6xl font-black mb-3 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl">USDC <span className="text-white/30 text-4xl">→</span> Payments</h1>
        <p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Send and receive payment requests on Arc L1</p>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          <div className={`${cardBg} rounded-2xl p-6 border ${borderClass} card-hover transition-all`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-pink-400" /> Create Request</h2>
            <div className="space-y-3">
              <input type="text" placeholder="What's it for?" value={desc} onChange={(e) => setDesc(e.target.value)} className={`w-full ${inputBg} border ${borderClass} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 transition`} />
              <input type="number" placeholder="Amount (USDC)" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full ${inputBg} border ${borderClass} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 transition`} />
              <button onClick={createRequest} disabled={loading !== '' || !wallet} className="w-full py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-pink-600 to-purple-600 hover:scale-105 transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {loading === 'Creating request...' ? <><Zap className="w-4 h-4 animate-spin" /> Creating...</> : <><Sparkles className="w-4 h-4" /> Create Request</>}
              </button>
            </div>
          </div>
          <div className={`${cardBg} rounded-2xl p-6 border ${borderClass} card-hover transition-all`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-cyan-400" /> Pay Request</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Request ID (0x...)" value={payId} onChange={(e) => setPayId(e.target.value)} className={`w-full ${inputBg} border ${borderClass} rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-cyan-500 transition`} />
              {gasEstimate && <div className="text-xs text-gray-400 text-center">⛽ Gas: {gasEstimate}</div>}
              <button onClick={handlePayClick} disabled={loading !== '' || !wallet} className="w-full py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-cyan-600 to-teal-600 hover:scale-105 transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {loading === 'Processing payment...' ? <><Zap className="w-4 h-4 animate-spin" /> Paying...</> : <><Send className="w-4 h-4" /> Pay Request</>}
              </button>
            </div>
          </div>
        </div>

        {wallet && (
          <div className={`mt-6 ${cardBg} rounded-2xl p-4 border ${borderClass} flex flex-wrap items-center justify-between gap-3`}>
            <div className="flex items-center gap-3">
              <div className="text-4xl w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">{dailyBadgeIcons[todayBadgeId]}</div>
              <div>
                <div className="flex items-center gap-2"><h3 className="font-semibold text-sm">Daily Badge</h3>{dailyStreak > 0 && <span className="text-xs bg-orange-500/30 px-2 py-0.5 rounded-full">🔥 {dailyStreak} day streak</span>}</div>
                <p className="text-xs text-gray-400">Mint 1 badge every day</p>
              </div>
            </div>
            <button onClick={mintDailyBadge} disabled={!canMintToday || loading !== ''} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${canMintToday ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105' : 'bg-gray-600/50 cursor-not-allowed'}`}>
              {canMintToday ? 'Mint Daily Badge' : 'Already Minted'}
            </button>
          </div>
        )}

        {wallet && (
          <>
            <div className="flex gap-4 mt-8 border-b border-white/10 mb-5 overflow-x-auto pb-1">
              {['requests', 'payments', 'badges', 'leaderboard', 'analytics'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-3 py-2 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>
                  {tab === 'analytics' ? '📈 Analytics' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === 'requests' && (
              <div className={`${cardBg} rounded-2xl p-5 border ${borderClass}`}>
                <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                  <h2 className="font-semibold flex items-center gap-2"><Layers className="w-4 h-4" /> My Requests</h2>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputBg} border ${borderClass} rounded-xl px-3 py-1.5 text-sm w-32 focus:outline-none focus:border-cyan-500`} />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className={`${inputBg} border ${borderClass} rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:border-cyan-500`}>
                      <option value="all">All</option><option value="pending">Pending</option><option value="paid">Paid</option>
                    </select>
                    <button onClick={() => exportToCSV(filteredRequests, 'arcpay-requests')} className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-sm"><Download className="w-3 h-3" /></button>
                  </div>
                </div>
                {isFetching ? <Skeleton className="h-24" /> : paginatedRequests.length === 0 ? <p className="text-center opacity-50 py-8 text-sm">No requests yet</p> : paginatedRequests.map((req, idx) => (
                  <div key={idx} className={`border-b ${borderClass} py-3 last:border-0`}>
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{req.description}</p>
                        <p className="text-xs font-mono opacity-50">{truncateHash(req.id)}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <button onClick={() => copyToClipboard(req.id)} className="bg-white/10 hover:bg-cyan-600 px-2 py-0.5 rounded text-xs">Copy ID</button>
                          <button onClick={() => shareRequestLink(req.id)} className="bg-white/10 hover:bg-green-600 px-2 py-0.5 rounded text-xs">Share</button>
                          <button onClick={() => { setQrRequestId(req.id); setShowQRModal(true); }} className="bg-white/10 hover:bg-purple-600 px-2 py-0.5 rounded text-xs">QR Code</button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{req.amount} USDC</p>
                        <p className={`text-xs ${req.paid ? 'text-green-400' : 'text-yellow-400'}`}>{req.paid ? 'Paid' : 'Pending'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <Pagination currentPage={requestsPage} totalPages={Math.ceil(filteredRequests.length / itemsPerPage)} onPageChange={setRequestsPage} />
              </div>
            )}

            {activeTab === 'payments' && (
              <div className={`${cardBg} rounded-2xl p-5 border ${borderClass}`}>
                <h2 className="font-semibold mb-4 flex items-center gap-2"><Send className="w-4 h-4" /> My Payments</h2>
                {isFetchingPayments ? <Skeleton className="h-20" /> : paginatedPayments.length === 0 ? <p className="text-center opacity-50 py-8 text-sm">No payments yet</p> : paginatedPayments.map((payment, idx) => (
                  <div key={idx} className={`border-b ${borderClass} py-3 last:border-0`}>
                    <p className="font-medium text-sm">{payment.description}</p>
                    <p className="text-xs font-mono opacity-50">{truncateHash(payment.id)}</p>
                    <p className="text-sm text-teal-400">{payment.amount} USDC</p>
                  </div>
                ))}
                <Pagination currentPage={paymentsPage} totalPages={Math.ceil(myPayments.length / itemsPerPage)} onPageChange={setPaymentsPage} />
              </div>
            )}

            {activeTab === 'badges' && (
              <div className={`${cardBg} rounded-2xl p-5 border ${borderClass}`}>
                <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl p-4 mb-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div><p className="text-xs text-gray-400">Tier</p><p className="font-bold text-lg">{tierIcon} {tierName}</p></div>
                    <div><p className="text-xs text-gray-400">Badges</p><p className="font-bold text-lg">{userBadgeCount}/6</p></div>
                    <div><p className="text-xs text-gray-400">Streak</p><p className="font-bold text-lg flex items-center justify-center gap-1"><Flame className="w-4 h-4 text-orange-500" /> {dailyStreak}</p></div>
                    <div><p className="text-xs text-gray-400">Points</p><p className="font-bold text-lg">{userPoints}</p></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-5">
                  {badgeConfig.map((badge, idx) => (
                    <div key={idx} onClick={() => checkAndMintBadge(badge.id, badge.name)} className={`text-center p-3 rounded-xl cursor-pointer transition-all hover:scale-105 ${userBadges[idx] ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/5 border border-white/10 opacity-60'}`}>
                      <div className="text-2xl mb-1">{badge.icon}</div>
                      <p className="text-xs font-medium">{badge.name}</p>
                      <p className="text-[10px] mt-1">{userBadges[idx] ? 'Unlocked' : 'Locked'}</p>
                    </div>
                  ))}
                </div>
                <h3 className="font-semibold text-sm mb-2">Daily Badges</h3>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">{dailyBadgeIcons.map((icon, idx) => (
                  <div key={idx} className="text-center p-2 rounded-lg bg-white/5 border border-white/10"><div className="text-xl">{icon}</div><p className="text-[10px]">{dailyBadgeNames[idx]}</p></div>
                ))}</div>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className={`${cardBg} rounded-2xl p-5 border ${borderClass}`}>
                <h2 className="font-semibold mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" /> Leaderboard</h2>
                {leaderboard.map((user, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-white/10 py-2">
                    <span className="flex items-center gap-2"><span className={`w-6 text-center font-bold text-sm ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : ''}`}>{idx+1}</span><span className="font-mono text-sm">{user.address}</span></span>
                    <span className="font-semibold text-sm">{user.points} pts</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className={`${cardBg} rounded-2xl p-5 border ${borderClass}`}>
                <h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingIcon className="w-4 h-4 text-cyan-400" /> Your Stats</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  <div className="bg-white/5 rounded-xl p-3 text-center"><p className="text-2xl font-bold">{totalRequests}</p><p className="text-xs text-gray-400">Requests</p></div>
                  <div className="bg-white/5 rounded-xl p-3 text-center"><p className="text-2xl font-bold">{totalPayments}</p><p className="text-xs text-gray-400">Payments</p></div>
                  <div className="bg-white/5 rounded-xl p-3 text-center"><p className="text-2xl font-bold">{totalVolume.toFixed(2)}</p><p className="text-xs text-gray-400">Volume (USDC)</p></div>
                  <div className="bg-white/5 rounded-xl p-3 text-center"><p className="text-2xl font-bold">{Math.round(badgeProgress)}%</p><p className="text-xs text-gray-400">Progress</p></div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-2"><span>Pending</span><span>{pendingRequests}</span></div>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-3"><div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${totalRequests ? (pendingRequests / totalRequests) * 100 : 0}%` }}></div></div>
                  <div className="flex justify-between text-sm mb-2"><span>Paid</span><span>{paidRequests}</span></div>
                  <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${totalRequests ? (paidRequests / totalRequests) * 100 : 0}%` }}></div></div>
                </div>
                <div className="mt-4 p-3 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 rounded-xl"><p className="text-xs text-center">🏆 {userBadgeCount}/6 badges collected</p></div>
              </div>
            )}
          </>
        )}

        <div className="mt-10 text-center">
          <p className="text-xs text-gray-500">Built on Arc by Circle</p>
          <div className="flex justify-center gap-4 mt-2 text-[10px] text-gray-600">
            <a href="https://github.com/mrpseudonym404/arcpay" target="_blank" className="hover:text-cyan-400">GitHub</a>
            <a href="https://faucet.circle.com" target="_blank" className="hover:text-cyan-400">Faucet</a>
          </div>
        </div>
      </div>
    </div>
  );
}
