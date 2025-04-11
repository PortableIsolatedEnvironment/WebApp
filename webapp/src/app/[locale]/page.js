import CourseCard from "@/components/course-card"
import { courseService } from "@/app/api/services/courseService"
import { getTranslations } from "next-intl/server";
import { Link } from '@/i18n/navigation';

export default async function CoursesPage() {
  const t = await getTranslations();

  let courses = [];

  try {
    courses = await courseService.getAllCourses();
  }
  catch (error) {
    console.error(error);
  }
  
  return (
    <div className="min-h-screen bg-light-gray">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">{t("CourseSelection")} </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses && courses.map((course, index) => (
            <Link key={index} href={`/course/${course.id}`}>
              <CourseCard title={course.name} description={course.id} />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

