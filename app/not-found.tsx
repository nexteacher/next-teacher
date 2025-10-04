import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "页面未找到 - NexTeacher",
  description: "您访问的页面不存在，请检查链接或返回首页继续浏览导师信息。",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-medium text-gray-900 mb-4">页面未找到</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          抱歉，您访问的页面不存在。可能是链接错误或页面已被移动。
        </p>
        <div className="space-x-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
          >
            返回首页
          </Link>
          <Link
            href="/search"
            className="inline-block px-6 py-3 border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors"
          >
            搜索导师
          </Link>
        </div>
      </div>
    </div>
  );
}

