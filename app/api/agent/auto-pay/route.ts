import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x7B5d915e35Ae3C76aBbCE0Bc28DC66636936a630';
const CONTRACT_ABI = [
  'function payRequest(bytes32 id) external payable',
  'function requests(bytes32) view returns (uint256 amount)'
];

export async function POST(req: NextRequest) {
  try {
    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    const reqData = await contract.requests(requestId);
    if (reqData.amount.isZero()) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const tx = await contract.payRequest(requestId, {
      value: reqData.amount,
      gasLimit: 1500000
    });

    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      requestId,
      txHash: tx.hash,
      status: 'paid',
      receipt
    });
  } catch (error: any) {
    console.error('Auto-pay failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
