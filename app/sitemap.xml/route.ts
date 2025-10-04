import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TeacherModel from '@/models/Teacher';

export async function GET() {
  try {
    await connectDB();
    
    // 获取所有活跃的导师
    const teachers = await TeacherModel.find(
      { isActive: true },
      { _id: 1, name: 1, university: 1, department: 1, updatedAt: 1 }
    ).lean();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nexteacher.wiki';
    const currentDate = new Date().toISOString();

    // 静态页面
    const staticPages = [
      {
        url: '',
        lastmod: currentDate,
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        url: '/search',
        lastmod: currentDate,
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        url: '/comments',
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: '0.8'
      },
      {
        url: '/crowdsource',
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: '0.7'
      },
      {
        url: '/about',
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: '0.6'
      }
    ];

    // 导师详情页面
    const teacherPages = teachers.map(teacher => ({
      url: `/teachers/${String(teacher._id)}`,
      lastmod: teacher.updatedAt ? new Date(teacher.updatedAt).toISOString() : currentDate,
      changefreq: 'weekly',
      priority: '0.8'
    }));

    // 生成 sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticPages, ...teacherPages].map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
      }
    });

  } catch (error) {
    console.error('生成 sitemap 失败:', error);
    return new NextResponse('生成 sitemap 失败', { status: 500 });
  }
}
