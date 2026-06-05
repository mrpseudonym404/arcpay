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
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const { ethereum } = window as any;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWallet('');
        setBalance('0');
      } else if (accounts[0] !== wallet) {
        setWallet(accounts[0]);
      }
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    return () => ethereum.removeListener('accountsChanged', handleAccountsChanged);
  }, [wallet]);

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
    } catch(e: any) {
      alert(e.message?.slice(0,60));
    }
    setLoading('');
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
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="group relative px-6 py-2 rounded-full bg-gradient-to-r from-pink-600 to-cyan-600 text-sm font-medium hover:shadow-lg hover:shadow-pink-500/25 transition-all duration-300 disabled:opacity-50"
            >
              {isConnecting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                <span className="flex items-center gap-2">✨ Connect Wallet</span>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="font-mono text-sm tracking-wider text-gray-300">{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
                <span className="text-xs bg-gradient-to-r from-pink-500/20 to-cyan-500/20 px-2 py-0.5 rounded-full text-pink-300">{parseFloat(balance).toFixed(2)} USDC</span>
              </div>
              <button
                onClick={disconnectWallet}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                🔌
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="relative z-10 text-center pt-16 pb-12">
        <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          USDC Payments
        </h1>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Send and receive payment requests on Arc L1 — fast, cheap, and secure.
        </p>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-pink-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-lg group-hover:scale-110 transition">📝</div>
              <h2 className="text-lg font-semibold">Create Request</h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="What's it for?"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 transition placeholder:text-gray-600"
              />
              <input
                type="number"
                placeholder="Amount (USDC)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 transition"
              />
              <button
                onClick={createRequest}
                disabled={loading !== '' || !wallet}
                className="w-full py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-pink-600 to-purple-600 hover:shadow-lg hover:shadow-pink-500/25 disabled:opacity-50 transition-all duration-300"
              >
                {loading === 'Creating request...' ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  '✨ Create Request'
                )}
              </button>
            </div>
          </div>

          <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-lg group-hover:scale-110 transition">💸</div>
              <h2 className="text-lg font-semibold">Pay Request</h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Request ID (0x...)"
                value={payId}
                onChange={(e) => setPayId(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-cyan-500 transition"
              />
              <button
                onClick={payRequest}
                disabled={loading !== '' || !wallet}
                className="w-full py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-cyan-600 to-teal-600 hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 transition-all duration-300"
              >
                {loading === 'Processing payment...' ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Paying...
                  </div>
                ) : (
                  '💸 Pay Request'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer with ✦ Built on Arc Testnet — USDC by Circle ✦ */}
        <div className="text-center mt-16 pt-6 border-t border-white/5">
          <p className="text-gray-400 text-xs tracking-wide">
            ✦ Built on <a href="https://arc.network" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 transition">Arc Testnet</a> — <a href="https://circle.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition">USDC by Circle</a> ✦
          </p>
          <p className="text-gray-600 text-[10px] font-mono mt-2">
            <a href="https://github.com/mrpseudonym404/arcpay" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition">📦 arcpay</a> • {CONTRACT_ADDRESS.slice(0,8)}...{CONTRACT_ADDRESS.slice(-6)}
          </p>
        </div>
      </div>
    </div>
  );
}
