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
    <div className="border border-gray-200 rounded-md p-3 flex items-center justify-between bg-white">
      <div className="text-xs text-gray-600">
        当前老师的信息是否有价值？
      </div>
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 text-xs border rounded disabled:opacity-50 inline-flex items-center gap-1.5"
          disabled={!walletAddress || submitting === 'valuable'}
          onClick={() => vote('valuable')}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>{submitting === 'valuable' ? '签名中...' : '有价值'} {loading ? '' : counts.valuable}</span>
        </button>
        <button
          className="px-3 py-1 text-xs border rounded disabled:opacity-50 inline-flex items-center gap-1.5"
          disabled={!walletAddress || submitting === 'not_valuable'}
          onClick={() => vote('not_valuable')}
        >
          <ThumbsDown className="w-3.5 h-3.5" />
          <span>{submitting === 'not_valuable' ? '签名中...' : '无价值'} {loading ? '' : counts.not_valuable}</span>
        </button>
      </div>
      {!walletAddress && (
        <div className="text-[11px] text-gray-400 ml-3">请先连接钱包</div>
      )}
      {error && <div className="text-[11px] text-red-500 ml-3">{error}</div>}
    </div>
  );
}


