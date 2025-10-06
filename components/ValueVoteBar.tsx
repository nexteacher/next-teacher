"use client";

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { generateSignatureMessage } from '@/lib/walletAuth';

export default function ValueVoteBar() {
  const pathname = usePathname();
  const { publicKey, signMessage } = useWallet();
  const walletAddress = useMemo(() => publicKey?.toBase58() || '', [publicKey]);

  const [counts, setCounts] = useState<{ valuable: number; not_valuable: number }>({ valuable: 0, not_valuable: 0 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<'valuable' | 'not_valuable' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/value-votes?pagePath=${encodeURIComponent(pathname)}`);
      const data = await res.json();
      if (data.success) setCounts(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const vote = async (value: 'valuable' | 'not_valuable') => {
    if (!walletAddress) return;
    if (!signMessage) {
      setError("钱包不支持签名功能，请使用其他钱包");
      return;
    }
    
    setSubmitting(value);
    setError(null);
    try {
      // 生成时间戳和签名消息
      const timestamp = Date.now();
      const message = generateSignatureMessage(walletAddress, timestamp, `vote-${value}`);
      
      // 请求用户签名
      const signature = await signMessage(new TextEncoder().encode(message));
      const signatureBase58 = Buffer.from(signature).toString('base64');
      
      const res = await fetch('/api/value-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pagePath: pathname, 
          walletAddress, 
          value,
          signature: signatureBase58,
          timestamp 
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '提交失败');
      fetchCounts();
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('User rejected')) {
        setError("用户取消了签名操作");
      } else {
        const msg = e instanceof Error ? e.message : '提交失败';
        setError(msg);
      }
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="border border-gray-200 p-4 md:p-5 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="text-sm text-gray-700 font-medium">
          这位老师的信息是否有帮助？
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`px-4 py-2 text-xs border transition-colors inline-flex items-center gap-1.5 ${
              !walletAddress || submitting === 'valuable' 
                ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
                : 'border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
            }`}
            disabled={!walletAddress || submitting === 'valuable'}
            onClick={() => vote('valuable')}
          >
            <ThumbsUp className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="font-medium">
              {submitting === 'valuable' ? '签名中...' : '有帮助'}
            </span>
            {!loading && (
              <span className="ml-1 text-gray-500">{counts.valuable}</span>
            )}
          </button>
          <button
            className={`px-4 py-2 text-xs border transition-colors inline-flex items-center gap-1.5 ${
              !walletAddress || submitting === 'not_valuable' 
                ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
                : 'border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
            }`}
            disabled={!walletAddress || submitting === 'not_valuable'}
            onClick={() => vote('not_valuable')}
          >
            <ThumbsDown className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="font-medium">
              {submitting === 'not_valuable' ? '签名中...' : '无帮助'}
            </span>
            {!loading && (
              <span className="ml-1 text-gray-500">{counts.not_valuable}</span>
            )}
          </button>
        </div>
      </div>
      {!walletAddress && (
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>请先连接钱包后投票</span>
        </div>
      )}
      {error && (
        <div className="mt-3 text-xs text-red-600 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}


