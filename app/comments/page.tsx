import { Metadata } from "next";
import Link from "next/link";
import connectDB from "@/lib/mongodb";
import CommentModel from "@/models/Comment";

export const metadata: Metadata = {
  title: "导师评论 - NexTeacher | 真实导师评价",
  description: "查看最新的导师评价和评论，了解学生的真实体验，帮助选择合适的研究生导师或博士导师。",
  keywords: "导师评论,导师评价,学生评价,导师反馈,研究生导师评价,博士导师评价",
  openGraph: {
    title: "导师评论 - NexTeacher",
    description: "查看最新的导师评价和评论，了解学生的真实体验。",
    type: 'website',
  },
  alternates: {
    canonical: 'https://nexteacher.wiki/comments',
  },
};

interface PageProps {
  searchParams: Promise<{
    mode?: string;
    limit?: string;
  }>;
}

function parseParams(params?: { mode?: string; limit?: string }) {
  const mode = params?.mode === "random" ? "random" : "latest";
  const limitNum = Math.max(1, Math.min(100, parseInt(params?.limit || "20", 10) || 20));
  return { mode, limit: limitNum } as const;
}

export default async function CommentsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const { mode, limit } = parseParams(resolvedParams);

  await connectDB();

  type CommentLean = {
    _id: string;
    teacher?: { _id?: string; name?: string; university?: string; department?: string; avatar?: string } | null;
    walletAddress: string;
    rating: number;
    content: string;
    source?: 'user' | 'admin' | 'imported';
    importedFrom?: string;
    createdAt: Date | string;
  };
  let comments: CommentLean[] = [];
  if (mode === "latest") {
    comments = (await CommentModel.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("teacher", "name university department avatar")
      .lean()) as unknown as CommentLean[];
  } else {
    // random
    comments = (await CommentModel.aggregate([
      { $sample: { size: limit } },
      {
        $lookup: {
          from: "teachers",
          localField: "teacher",
          foreignField: "_id",
          as: "teacher"
        }
      },
      { $unwind: { path: "$teacher", preserveNullAndEmptyArrays: true } }
    ])) as unknown as CommentLean[];
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-medium text-black">评论</h1>
          <Link href="/" className="text-sm text-gray-900 hover:text-black">
            返回首页 →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-gray-500">展示方式</span>
          <Link
            href={`/comments?mode=latest&limit=${limit}`}
            className={`px-3 py-1 border ${mode === "latest" ? "bg-black text-white border-black" : "border-gray-300 text-gray-900 hover:bg-gray-50"}`}
          >
            最新
          </Link>
          <Link
            href={`/comments?mode=random&limit=${limit}`}
            className={`px-3 py-1 border ${mode === "random" ? "bg-black text-white border-black" : "border-gray-300 text-gray-900 hover:bg-gray-50"}`}
          >
            随机
          </Link>
          <span className="ml-4 text-gray-500">数量</span>
          {[10, 20, 50].map((n) => (
            <Link
              key={n}
              href={`/comments?mode=${mode}&limit=${n}`}
              className={`px-3 py-1 border ${limit === n ? "bg-black text-white border-black" : "border-gray-300 text-gray-900 hover:bg-gray-50"}`}
            >
              {n}
            </Link>
          ))}
        </div>

        {comments.length === 0 ? (
          <div className="text-sm text-gray-500">暂无评论</div>
        ) : (
          <div className="space-y-6">
            {comments.map((c) => {
              const teacher = c.teacher || undefined;
              return (
                <div key={c._id.toString()} className="border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-h-[16px]">
                      {c.source !== "imported" && (
                        <span className="text-xs text-gray-500 break-all">{c.walletAddress}</span>
                      )}
                      {c.source === "imported" && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200">
                          来自外部{c.importedFrom ? ` · ${c.importedFrom}` : ""}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-900">评分 {c.rating}/5</span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.content}</p>
                  <div className="text-[11px] text-gray-400 mt-2">
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                  {teacher?._id && (
                    <div className="mt-3 text-sm">
                      <Link
                        href={`/teachers/${teacher._id}`}
                        className="text-gray-900 hover:text-black underline underline-offset-4"
                      >
                        前往导师：{teacher.name || "查看详情"}
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


