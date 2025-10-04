import { Metadata } from "next";

export const metadata: Metadata = {
  title: "搜索导师 - NexTeacher | 导师评价平台",
  description: "搜索和查找研究生导师、博士导师信息，按学校、院系、研究领域筛选，查看导师详细信息和学生评价。",
  keywords: "导师搜索,导师查找,研究生导师搜索,博士导师搜索,导师筛选,导师查询",
  openGraph: {
    title: "搜索导师 - NexTeacher",
    description: "搜索和查找研究生导师、博士导师信息，按学校、院系、研究领域筛选。",
    type: 'website',
  },
  alternates: {
    canonical: 'https://nexteacher.wiki/search',
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

