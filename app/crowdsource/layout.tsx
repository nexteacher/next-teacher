import { Metadata } from "next";

export const metadata: Metadata = {
  title: "众包贡献 - NexTeacher | 完善导师信息",
  description: "参与众包贡献，完善导师信息，添加缺失的导师资料，帮助构建更完整的导师评价数据库。",
  keywords: "众包,导师信息,完善资料,导师数据库,贡献,Web3",
  openGraph: {
    title: "众包贡献 - NexTeacher",
    description: "参与众包贡献，完善导师信息，添加缺失的导师资料。",
    type: 'website',
  },
  alternates: {
    canonical: 'https://nexteacher.wiki/crowdsource',
  },
};

export default function CrowdsourceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

