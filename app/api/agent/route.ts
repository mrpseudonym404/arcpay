import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630';
const CONTRACT_ABI = [
  'function createRequest(string description, uint256 amount) returns (bytes32)'
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const description = searchParams.get('description');
    const amount = searchParams.get('amount');

    console.log('GET /api/agent - params:', { description, amount });

    if (!description || !amount) {
      return NextResponse.json({ error: 'Missing description or amount' }, { status: 400 });
    }

    // Return 402 Payment Required (x402 protocol)
    return new NextResponse(null, {
      status: 402,
      headers: {
        'X-Payment-Required': 'true',
        'X-Payment-Amount': amount,
        'X-Payment-Token': 'USDC',
        'X-Payment-Chain': 'Arc Testnet',
        'X-Payment-Description': description,
        'X-Payment-Merchant': 'ArcPay',
        'X-Payment-Url': `${req.nextUrl.origin}/api/agent/pay`,
      }
    });
  } catch (error: any) {
    console.error('GET /api/agent error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, amount } = body;

    if (!description || !amount) {
      return NextResponse.json({ error: 'Missing description or amount' }, { status: 400 });
    }

    // Pakai agent wallet
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const privateKey = process.env.AGENT_PRIVATE_KEY || '';
    if (!privateKey) {
      throw new Error('AGENT_PRIVATE_KEY not set in .env.local');
    }
    const signer = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const amt = ethers.parseUnits(amount.toString(), 18);
    const tx = await contract.createRequest(description, amt);
    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      requestId: receipt?.hash || '',
      description,
      amount,
      status: 'created',
      agent: process.env.AGENT_ADDRESS || 'unknown',
    });
  } catch (error: any) {
    console.error('Agent POST failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
