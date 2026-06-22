import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630';
const CONTRACT_ABI = [
  'function requests(bytes32) view returns (address creator, string description, uint256 amount, bool paid)'
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const request = await contract.requests(requestId);

    if (request.paid) {
      return NextResponse.json({
        success: true,
        requestId,
        amount: ethers.formatUnits(request.amount, 18),
        status: 'paid',
        message: 'Payment verified on-chain',
      });
    }

    return NextResponse.json({
      success: false,
      requestId,
      status: 'pending',
      message: 'Payment not yet confirmed on-chain',
    });
  } catch (error: any) {
    console.error('Payment verification failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
