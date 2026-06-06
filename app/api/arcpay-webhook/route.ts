import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramMessage(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (e) { console.error(e); }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const notification = payload.notification;
    const type = payload.notificationType;
    
    if (type === 'webhooks.test') {
      await sendTelegramMessage('✅ Webhook aktif! ArcPay monitor siap.');
      return NextResponse.json({ success: true });
    }
    
    if (notification?.eventSignature === 'RequestCreated') {
      const msg = `📝 New Request Created\nTx: ${notification.txHash?.slice(0,16)}...`;
      await sendTelegramMessage(msg);
    }
    
    if (notification?.eventSignature === 'RequestPaid') {
      const msg = `💰 Request Paid\nTx: ${notification.txHash?.slice(0,16)}...`;
      await sendTelegramMessage(msg);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'ArcPay webhook is working' });
}
