import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630';
const CONTRACT_ABI = [
  'function requests(bytes32) view returns (address creator, string description, uint256 amount, bool paid)'
];

const idempotencyStore = new Map();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, idempotencyKey } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
    }

    // Cek idempotency
    if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
      const cached = idempotencyStore.get(idempotencyKey);
      return NextResponse.json({
        success: true,
        requestId,
        amount: cached.amount || '0',
        status: cached.status || 'pending',
        receipt: cached.receipt || null,
        message: 'Duplicate request (idempotency key matched)',
        cached: true,
      });
    }

    // Verifikasi on-chain
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://rpc.testnet.arc.network');
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const request = await contract.requests(requestId);

    const amount = ethers.formatUnits(request.amount, 18);
    const isPaid = request.paid;

    // Authority = agent address yang melakukan payment
    const authority = process.env.AGENT_ADDRESS || 'unknown';
    // Scope = request ID yang dibayar
    const scope = `request:${requestId}`;

    const response = {
      success: isPaid,
      requestId,
      amount,
      status: isPaid ? 'paid' : 'pending',
      receipt: isPaid ? {
        payer: request.creator,
        authority: authority,
        scope: scope,
        price: amount,
        settlementRef: requestId,
        status: 'paid',
        outputHash: requestId,
      } : null,
      message: isPaid ? 'Payment verified on-chain' : 'Payment not yet confirmed on-chain',
    };

    // Simpan idempotency
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, {
        amount: response.amount,
        status: response.status,
        receipt: response.receipt,
      });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Payment verification failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
