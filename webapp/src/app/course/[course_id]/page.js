
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus} from "lucide-react"
import { Button } from "@/components/ui/button"
import BackButton from "@/components/back-button";
import ExamCard from "@/components/editable-card";
import CourseData from "@/data/courses.json";

async function getCourseData(course_id) {
  const course = CourseData.find((course) => course.id == course_id);
  return course;
}

export default async function CoursePage({ params }) {
  const { course_id } = await params;
  const course = await getCourseData(course_id);

  if (!course) {
    return notFound(); // Show 404 if course doesn't exist
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">{course.name}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {course.exams.map((exam) => (
              <ExamCard
                key={exam.id}
                name={exam.name}
                // description={exam.description} // This line is commented out because the description is not present in the JSON file
                link={`/course/${course.id}/${exam.id}`}
                edit_link={`/course/${course.id}/${exam.id}/edit_exam`}
              />
            ))}
          </div>

        {/* Back Button */}
        <div className="mt-8">
          <BackButton />
        </div>

        {/* Floating Action Button - Bottom Left */}
        <Link href={`/course/${course.id}/create_exam`}>
          <Button 
            size="icon" 
            className="fixed bottom-40 right-40 h-24 w-24 rounded-full bg-[#008F4C] hover:bg-[#006B3F] shadow-lg border-4 border-white"
          >
            <Plus className="w-16 h-16 text-white" />
          </Button>
        </Link>
      </main>
    </div>
    );
  }
