import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630';
const CONTRACT_ABI = [
  'function createRequest(string description, uint256 amount) returns (bytes32)'
];

export async function GET(req: NextRequest) {
  const { description, amount } = req.nextUrl.searchParams;
  if (!description || !amount) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }
  return new NextResponse(null, {
    status: 402,
    headers: {
      'X-Payment-Required': 'true',
      'X-Payment-Amount': amount,
      'X-Payment-Token': 'USDC',
      'X-Payment-Chain': 'Arc Testnet',
      'X-Payment-Description': description,
      'X-Payment-Merchant': 'ArcPay',
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, amount } = body;

    console.log('🔵 POST /api/agent received:', { description, amount });

    if (!description || !amount) {
      return NextResponse.json({ error: 'Missing description or amount' }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const privateKey = process.env.AGENT_PRIVATE_KEY || '';
    if (!privateKey) {
      console.error('❌ AGENT_PRIVATE_KEY not set');
      throw new Error('AGENT_PRIVATE_KEY not set');
    }

    console.log('🔑 Using agent wallet:', process.env.AGENT_ADDRESS || 'unknown');

    const signer = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const amt = ethers.parseUnits(amount.toString(), 18);
    console.log('🔄 Creating request...');
    const tx = await contract.createRequest(description, amt, { gasLimit: 800000 });
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed:', receipt?.hash);

    const requestId = receipt?.logs?.[0]?.topics?.[1] || '';
    console.log('📝 Request ID:', requestId);

    if (!requestId) {
      throw new Error('No request ID from transaction');
    }

    return NextResponse.json({
      success: true,
      requestId,
      description,
      amount,
      status: 'created',
      agent: process.env.AGENT_ADDRESS || 'unknown',
    });
  } catch (error: any) {
    console.error('❌ Agent POST failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
