'use client';

import { useState, useEffect } from 'react';
import { CrowdAction } from '@/types/crowdAction';
import Link from 'next/link';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function BlockchainBrowserPage() {
  const [actions, setActions] = useState<CrowdAction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    walletAddress: '',
    actionType: '',
    targetType: ''
  });
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [selectedPayload, setSelectedPayload] = useState<{action: CrowdAction, payload: Record<string, unknown>} | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (filters.walletAddress) params.set('walletAddress', filters.walletAddress);
      if (filters.actionType) params.set('actionType', filters.actionType);
      if (filters.targetType) params.set('targetType', filters.targetType);

      const res = await fetch(`/api/crowd-actions/browser?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || '加载失败');
      
      setActions(data.data);
      setPagination(data.pagination);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '加载失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // 重置到第一页
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionTypeLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      'create': '创建',
      'read': '查看',
      'update': '更新',
      'delete': '删除',
      'like': '点赞',
      'unlike': '取消点赞',
      'dislike': '点踩',
      'undislike': '取消点踩'
    };
    return labels[actionType] || actionType;
  };

  const getTargetTypeLabel = (targetType: string) => {
    const labels: Record<string, string> = {
      'teacher': '导师',
      'comment': '评论',
      'other': '其他'
    };
    return labels[targetType] || targetType;
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(itemId));
      // 2秒后清除复制状态
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedItems(prev => new Set(prev).add(itemId));
        setTimeout(() => {
          setCopiedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
        }, 2000);
      } catch (fallbackErr) {
        console.error('降级复制也失败:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const openPayloadModal = (action: CrowdAction) => {
    setSelectedPayload({ action, payload: action.payload || {} });
  };

  const closePayloadModal = () => {
    setSelectedPayload(null);
  };

  const getTeacherLink = (payload: Record<string, unknown>) => {
    // 检查 payload 中是否包含 teacherId
    if (payload && payload.teacherId && typeof payload.teacherId === 'string') {
      return `/teachers/${payload.teacherId}`;
    }
    return null;
  };

  const getCommentLink = (payload: Record<string, unknown>) => {
    // 检查 payload 中是否包含 commentId 和 teacherId
    if (payload && payload.commentId && payload.teacherId && 
        typeof payload.commentId === 'string' && typeof payload.teacherId === 'string') {
      return `/teachers/${payload.teacherId}#comment-${payload.commentId}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* 页面标题 */}
        <div className="mb-12">
          <h1 className="text-3xl font-medium text-black mb-2">行为浏览器</h1>
          <p className="text-sm text-gray-500">查看所有众包行为的公开透明记录</p>
        </div>

        {/* 筛选器 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-6">筛选条件</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                钱包地址
              </label>
              <input
                type="text"
                value={filters.walletAddress}
                onChange={(e) => handleFilterChange('walletAddress', e.target.value)}
                placeholder="输入钱包地址..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                操作类型
              </label>
              <select
                value={filters.actionType}
                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
              >
                <option value="">全部</option>
                <option value="create">创建</option>
                <option value="read">查看</option>
                <option value="update">更新</option>
                <option value="delete">删除</option>
                <option value="like">点赞</option>
                <option value="unlike">取消点赞</option>
                <option value="dislike">点踩</option>
                <option value="undislike">取消点踩</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                目标类型
              </label>
              <select
                value={filters.targetType}
                onChange={(e) => handleFilterChange('targetType', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
              >
                <option value="">全部</option>
                <option value="teacher">导师</option>
                <option value="comment">评论</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        {pagination && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                共找到 <span className="font-medium text-black">{pagination.total}</span> 条记录
              </div>
              <div className="text-sm text-gray-500">
                第 {pagination.page} / {pagination.totalPages} 页
              </div>
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
            <span className="ml-3 text-sm text-gray-500">加载中...</span>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-700">{error}</div>
          </div>
        )}

        {/* 数据表格 */}
        {!loading && !error && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      交易哈希
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      钱包地址
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      目标类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      目标ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间戳
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      数据
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {actions.map((action) => (
                    <tr key={action._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {action._id ? (
                          <button
                            onClick={() => copyToClipboard(action._id!, `hash-${action._id}`)}
                            className={`hover:text-black transition-colors cursor-pointer relative group ${
                              copiedItems.has(`hash-${action._id}`) ? 'text-black font-medium' : 'text-gray-700'
                            }`}
                            title="点击复制完整哈希"
                          >
                            {truncateAddress(action._id)}
                            {copiedItems.has(`hash-${action._id}`) && (
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                已复制!
                              </span>
                            )}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              点击复制
                            </span>
                          </button>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        <button
                          onClick={() => copyToClipboard(action.walletAddress, `wallet-${action._id}`)}
                          className={`hover:text-black transition-colors cursor-pointer relative group ${
                            copiedItems.has(`wallet-${action._id}`) ? 'text-black font-medium' : 'text-gray-700'
                          }`}
                          title="点击复制完整地址"
                        >
                          {truncateAddress(action.walletAddress)}
                          {copiedItems.has(`wallet-${action._id}`) && (
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              已复制!
                            </span>
                          )}
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            点击复制
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          action.actionType === 'create' ? 'bg-gray-900 text-white' :
                          action.actionType === 'update' ? 'bg-gray-700 text-white' :
                          action.actionType === 'delete' ? 'bg-gray-500 text-white' :
                          action.actionType === 'like' ? 'bg-gray-800 text-white' :
                          action.actionType === 'dislike' ? 'bg-gray-600 text-white' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {getActionTypeLabel(action.actionType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {getTargetTypeLabel(action.targetType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {action.targetId ? (
                          <button
                            onClick={() => copyToClipboard(action.targetId!, `target-${action._id}`)}
                            className={`hover:text-black transition-colors cursor-pointer relative group ${
                              copiedItems.has(`target-${action._id}`) ? 'text-black font-medium' : 'text-gray-600'
                            }`}
                            title="点击复制完整ID"
                          >
                            {truncateAddress(action.targetId)}
                            {copiedItems.has(`target-${action._id}`) && (
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                已复制!
                              </span>
                            )}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              点击复制
                            </span>
                          </button>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(action.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {action.payload ? (
                          <button
                            onClick={() => openPayloadModal(action)}
                            className="text-gray-700 hover:text-black transition-colors cursor-pointer underline"
                          >
                            查看数据
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页控件 */}
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    下一页
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      显示第 <span className="font-medium text-black">{(page - 1) * pagination.limit + 1}</span> 到{' '}
                      <span className="font-medium text-black">
                        {Math.min(page * pagination.limit, pagination.total)}
                      </span>{' '}
                      条，共 <span className="font-medium text-black">{pagination.total}</span> 条记录
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={!pagination.hasPrevPage}
                        className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        上一页
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={!pagination.hasNextPage}
                        className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        下一页
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && actions.length === 0 && (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
            <div className="text-gray-500 text-base mb-2">暂无数据</div>
            <div className="text-gray-400 text-sm">尝试调整筛选条件</div>
          </div>
        )}

        {/* 数据载荷模态框 */}
        {selectedPayload && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              {/* 背景遮罩 */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
                onClick={closePayloadModal}
              ></div>
              
              {/* 模态框内容 */}
              <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-gray-200">
                {/* 模态框头部 */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-black">
                    数据载荷详情
                  </h3>
                  <button
                    onClick={closePayloadModal}
                    className="text-gray-400 hover:text-black transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* 模态框内容 */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {/* 基本信息 */}
                  <div className="mb-6">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">基本信息</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">交易哈希:</span>
                        <span className="ml-2 font-mono text-black">
                          {selectedPayload.action._id ? truncateAddress(selectedPayload.action._id) : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">钱包地址:</span>
                        <span className="ml-2 font-mono text-black">
                          {truncateAddress(selectedPayload.action.walletAddress)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">操作类型:</span>
                        <span className="ml-2 text-black">
                          {getActionTypeLabel(selectedPayload.action.actionType)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">目标类型:</span>
                        <span className="ml-2 text-black">
                          {getTargetTypeLabel(selectedPayload.action.targetType)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">目标ID:</span>
                        <span className="ml-2 font-mono text-black">
                          {selectedPayload.action.targetId ? truncateAddress(selectedPayload.action.targetId) : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">时间戳:</span>
                        <span className="ml-2 text-black">
                          {formatDate(selectedPayload.action.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    {/* 相关链接 */}
                    {(getTeacherLink(selectedPayload.payload) || getCommentLink(selectedPayload.payload)) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">相关链接</h5>
                        <div className="flex flex-wrap gap-3">
                          {getTeacherLink(selectedPayload.payload) && (
                            <Link
                              href={getTeacherLink(selectedPayload.payload)!}
                              className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
                              onClick={closePayloadModal}
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              查看导师页面
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 数据载荷 */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">数据载荷</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono">
                        {JSON.stringify(selectedPayload.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
                
                {/* 模态框底部 */}
                <div className="flex justify-end p-6 border-t border-gray-200">
                  <button
                    onClick={closePayloadModal}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <p className="text-xs text-gray-400 text-center">导师评价系统 - 行为浏览器</p>
        </div>
      </footer>
    </div>
  );
}
