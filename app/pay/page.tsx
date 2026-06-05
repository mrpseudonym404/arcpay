'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reqId = searchParams.get('reqId');

  useEffect(() => {
    if (reqId) {
      router.push(`/?reqId=${reqId}`);
    } else {
      router.push('/');
    }
  }, [reqId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Redirecting to payment...</p>
      </div>
    </div>
  );
}
