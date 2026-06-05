'use client';
import { useState } from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0xCb3C8104ba53ec98513e2AD4f02135B2704cB84b';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const ARC_CHAIN_ID = '0x4CE162';

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
    if (!ethereum) {
      alert('Install MetaMask or Rabby wallet first!');
      return;
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) throw new Error('No account granted');

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
        } else {
          throw switchError;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWallet(address);
      setResult(`✓ Connected: ${address.slice(0,6)}...${address.slice(-4)}`);
    } catch (err: any) {
      console.error(err);
      alert(`Connection failed: ${err.message?.slice(0, 100) || 'Unknown error'}`);
      setResult(`✗ ${err.message?.slice(0, 60)}`);
    }
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
      await tx.wait();
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

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">ArcPay - USDC Payment Requests on Arc L1</h1>
      {!wallet ? (
        <button onClick={connectWallet} className="bg-blue-600 text-white px-4 py-2 rounded">
          Connect Wallet
        </button>
      ) : (
        <p className="text-green-600 mb-4">✓ Connected: {wallet.slice(0,6)}...{wallet.slice(-4)}</p>
      )}
      <div className="mt-4 text-sm text-gray-500">Contract: {CONTRACT_ADDRESS} | Arc Testnet</div>
    </main>
  );
}
