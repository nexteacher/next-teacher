'use client';

import { useState } from 'react';

export default function AboutPage() {
  const [copied, setCopied] = useState(false);
  const cid = 'bafybeigbn35wdr4mte3ioslnbr2o7i6kwtdh3tadyxmwtezvsrs7uhzvxm';

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* 页面标题 */}
        <div className="mb-12">
          <h1 className="text-3xl font-medium text-black mb-2">关于 NexTeacher</h1>
        </div>

        {/* 项目介绍 */}
        <section className="mb-12">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-medium text-black mb-4">项目简介</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              NexTeacher 是一个基于 Web3 理念的导师评价平台，致力于为学生提供真实、透明的导师信息，帮助学生做出更好的升学选择。
            </p>
          </div>
        </section>

        {/* IPFS 数据备份 */}
        <section className="mb-12">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-medium text-black mb-4">数据备份与恢复</h2>
            
            {/* 说明文字 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                <span className="font-medium text-black">💡 关于数据存储：</span>
              </p>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">
                本站并非真正意义上的&ldquo;全链上&rdquo;应用。考虑到数据规模较小且更新频繁，我们采用<span className="font-medium text-black">定期备份</span>的方式，将站点代码和数据库数据定期上传至 IPFS（星际文件系统）。
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                这种方式既保证了数据的去中心化存储和永久可访问性，又避免了频繁上链带来的高昂成本。只要站点代码和数据库数据通过 IPFS 存储，就可以<span className="font-medium text-black">随时复原重建</span>整个平台。
              </p>
            </div>

            {/* CID 信息 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  IPFS CID
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-mono break-all">
                    {cid}
                  </code>
                  <button
                    onClick={() => handleCopy(cid)}
                    className="px-4 py-3 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
                  >
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
                <div className="mt-2">
                    <p className="text-sm text-gray-600">更新时间：{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* 备份说明 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">备份内容包括：</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>完整的 MongoDB 数据库数据（导师信息、评论、众包行为等）</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 技术栈 */}
        <section className="mb-12">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-medium text-black mb-4">技术栈</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">前端</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Next.js 15 (App Router)</li>
                  <li>• React 19</li>
                  <li>• Tailwind CSS</li>
                  <li>• Solana Wallet Adapter</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">后端与存储</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• MongoDB</li>
                  <li>• IPFS (数据备份)</li>
                  <li>• Pinata (IPFS Gateway)</li>
                  <li>• Solana (签名验证)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 如何使用备份恢复 */}
        <section className="mb-12">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-medium text-black mb-4">如何恢复平台</h2>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-medium text-black mb-2">1. 获取备份数据</h3>
                <p className="text-gray-600 pl-4">
                  通过上述 IPFS CID 地址下载完整的备份数据包。
                </p>
              </div>
              <div>
                <h3 className="font-medium text-black mb-2">2. 恢复数据库</h3>
                <p className="text-gray-600 pl-4">
                  使用 MongoDB 的导入工具恢复数据库数据（.bson 文件）。
                </p>
              </div>
              <div>
                <h3 className="font-medium text-black mb-2">3. 部署应用</h3>
                <p className="text-gray-600 pl-4">
                  按照 README 文档的说明，安装依赖并启动 Next.js 应用。
                </p>
              </div>
              <div>
                <h3 className="font-medium text-black mb-2">4. 配置环境</h3>
                <p className="text-gray-600 pl-4">
                  设置数据库连接、Solana RPC 等环境变量，完成部署。
                </p>
              </div>
            </div>
          </div>
        </section>



      </main>
    </div>
  );
}

