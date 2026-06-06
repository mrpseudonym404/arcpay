'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PaymentsPage() {
  const [wallet, setWallet] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function connectWallet() {
    const { ethereum } = window as any;
    if (!ethereum) return alert('Install wallet first!');
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    setWallet(accounts[0]);
  }

  async function fetchMyPayments() {
    if (!wallet) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('payer', wallet)
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    else setPayments(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (wallet) fetchMyPayments();
  }, [wallet]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">💸 My Payments</h1>
        
        {!wallet ? (
          <button 
            onClick={connectWallet}
            className="bg-cyan-600 px-6 py-3 rounded-xl hover:scale-105 transition"
          >
            Connect Wallet to See Your Payments
          </button>
        ) : (
          <>
            <div className="bg-white/10 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-300">Connected:</p>
              <p className="font-mono">{wallet.slice(0,10)}...{wallet.slice(-8)}</p>
            </div>
            
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl">
                <p className="text-gray-400">No payments found.</p>
                <p className="text-sm text-gray-500 mt-2">Make a payment on ArcPay first!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div key={p.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-400">Tx Hash</p>
                        <p className="font-mono text-xs">{p.tx_hash}</p>
                        <p className="text-lg font-bold text-cyan-400 mt-2">{p.amount} USDC</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleString()}</p>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full mt-1 inline-block">
                          ✅ {p.status || 'Completed'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
