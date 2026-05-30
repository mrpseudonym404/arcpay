'use client';
import { useState } from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0xCb3C8104ba53ec98513e2AD4f02135B2704cB84b';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const ARC_CHAIN_ID = '0x4CE162'; // 5042002 in hex

const CONTRACT_ABI = [
  'function createRequest(string description, uint256 amount) returns (bytes32)',
  'function pay(bytes32 id) external',
  'function getRequests(address user) view returns (bytes32[])',
  'function requests(bytes32) view returns (address creator, string description, uint256 amount, bool paid)'
];

const USDC_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)'
];

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [payId, setPayId] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState('');
  const [result, setResult] = useState('');

  async function connectWallet() {
    const { ethereum } = window as any;
    if (!ethereum) return alert('Install MetaMask/Rabby!');
    
    await ethereum.request({ method: 'eth_requestAccounts' });
    
    // Switch to Arc Testnet
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARC_CHAIN_ID }]
      });
    } catch {
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
    }
    
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    setWallet(await signer.getAddress());
  }

  async function createRequest() {
    if (!desc || !amount) return;
    setLoading('Creating...');
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const dec = await usdc.decimals();
      const amt = ethers.parseUnits(amount, dec);
      const tx = await contract.createRequest(desc, amt);
      const receipt = await tx.wait();
      setResult(`✓ Request created! TX: ${tx.hash.slice(0,20)}...`);
      setDesc(''); setAmount('');
    } catch(e: any) {
      setResult(`✗ ${e.message?.slice(0,60)}`);
    }
    setLoading('');
  }

  async function payRequest() {
    if (!payId) return;
    setLoading('Paying...');
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      
      const req = await contract.requests(payId);
      await (await usdc.approve(CONTRACT_ADDRESS, req.amount)).wait();
      const tx = await contract.pay(payId);
      await tx.wait();
      setResult(`✓ Payment sent! TX: ${tx.hash.slice(0,20)}...`);
      setPayId('');
    } catch(e: any) {
      setResult(`✗ ${e.message?.slice(0,60)}`);
    }
    setLoading('');
  }

  async function loadRequests() {
    if (!wallet) return;
    setLoading('Loading...');
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const ids = await contract.getRequests(wallet);
      const reqs = await Promise.all(ids.map(async (id: string) => {
        const r = await contract.requests(id);
        return { id, creator: r.creator, description: r.description, amount: ethers.formatUnits(r.amount, 6), paid: r.paid };
      }));
      setRequests(reqs);
    } catch(e: any) {
      setResult(`✗ ${e.message?.slice(0,60)}`);
    }
    setLoading('');
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">ArcPay</h1>
          <p className="text-gray-400">USDC Payment Requests on Arc L1</p>
          <p className="text-xs text-gray-600 mt-1">Powered by Circle Arc Testnet</p>
        </div>

        {/* Connect Wallet */}
        {!wallet ? (
          <button onClick={connectWallet}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold mb-6">
            Connect Wallet
          </button>
        ) : (
          <div className="bg-gray-900 rounded-xl p-3 mb-6 text-center">
            <span className="text-green-400 text-sm">✓ {wallet.slice(0,8)}...{wallet.slice(-6)}</span>
          </div>
        )}

        {wallet && (
          <>
            {/* Create Request */}
            <div className="bg-gray-900 rounded-xl p-5 mb-4">
              <h2 className="font-semibold mb-3 text-blue-300">Create Payment Request</h2>
              <input value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="Description (e.g. Invoice #001)"
                className="w-full bg-gray-800 rounded-lg p-3 mb-3 text-sm outline-none" />
              <input value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Amount USDC (e.g. 10)"
                type="number" className="w-full bg-gray-800 rounded-lg p-3 mb-3 text-sm outline-none" />
              <button onClick={createRequest}
                className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-sm font-semibold">
                {loading === 'Creating...' ? 'Creating...' : 'Create Request'}
              </button>
            </div>

            {/* Pay Request */}
            <div className="bg-gray-900 rounded-xl p-5 mb-4">
              <h2 className="font-semibold mb-3 text-green-300">Pay a Request</h2>
              <input value={payId} onChange={e => setPayId(e.target.value)}
                placeholder="Request ID (bytes32)"
                className="w-full bg-gray-800 rounded-lg p-3 mb-3 text-sm outline-none font-mono" />
              <button onClick={payRequest}
                className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg text-sm font-semibold">
                {loading === 'Paying...' ? 'Paying...' : 'Pay Now'}
              </button>
            </div>

            {/* My Requests */}
            <div className="bg-gray-900 rounded-xl p-5 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-purple-300">My Requests</h2>
                <button onClick={loadRequests}
                  className="bg-purple-700 hover:bg-purple-800 px-3 py-1 rounded-lg text-xs">
                  Load
                </button>
              </div>
              {requests.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-4">No requests yet</p>
              ) : (
                requests.map((r, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-3 mb-2">
                    <div className="flex justify-between">
                      <span className="text-sm">{r.description}</span>
                      <span className={`text-xs px-2 py-1 rounded ${r.paid ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}`}>
                        {r.paid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                    <div className="text-blue-400 font-semibold mt-1">{r.amount} USDC</div>
                    <div className="text-gray-600 text-xs mt-1 font-mono truncate">{r.id}</div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-xl p-3 text-sm text-center ${result.startsWith('✓') ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
            {result}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-gray-700 text-xs">
          Contract: {CONTRACT_ADDRESS.slice(0,10)}... | Arc Testnet
        </div>
      </div>
    </main>
  );
}
