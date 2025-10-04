import Link from 'next/link';
import Image from 'next/image';
import { Teacher } from '@/types/teacher';

interface TeacherCardProps {
  teacher: Teacher;
}

export default function TeacherCard({ teacher }: TeacherCardProps) {

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-200">
      <Link href={`/teachers/${teacher._id}`} className="block">
        <div className="flex items-start space-x-4">
          {/* 头像 */}
          <div className="flex-shrink-0">
            <Image
              src={teacher.avatar || '/images/default-avatar.png'}
              alt={teacher.name}
              width={80}
              height={80}
              className="rounded-full object-cover border-2 border-gray-200"
            />
          </div>

          {/* 基本信息 */}
          <div className="flex-1 min-w-0">

            <div className="space-y-1 text-sm text-gray-600">
              <p className="font-medium">{teacher.title}</p>
              <p>{teacher.department}</p>
              <p className="text-blue-600">{teacher.university}</p>
            </div>

            {/* 研究领域 */}
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {(teacher.researchAreas ?? []).slice(0, 3).map((area, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {area}
                  </span>
                ))}
                {(teacher.researchAreas ?? []).length > 3 && (
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    +{(teacher.researchAreas ?? []).length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* 此处原有标签、简介、评分展示依赖未在 Teacher 类型中定义的字段，暂不渲染 */}
          </div>
        </div>
      </Link>
    </div>
  );
}