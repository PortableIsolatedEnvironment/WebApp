import BackButton from "@/components/back-button"
import Navbar from "@/components/navbar"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"
import SessionCard from "@/components/editable-card"
import ExamData from "@/data/courses.json"

async function getExamData(course_id, exam_id) {
  const course = ExamData.find((course) => course.id == course_id);
  if (!course) {
    return null;
  }
  const exam = course.exams.find((exam) => exam.id == exam_id);
  return exam;
}


export default async function ExamPage({ params }) {
  const { course_id, exam_id } = await params;
  const exam = await getExamData(course_id, exam_id);

if (!exam) {
    return notFound(); // Show 404 if exam or course doesn't exist
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">{exam.name}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exam.sessions.map((session) => (
              <SessionCard
                key={session.id}
                name={session.name}
                description={session.date}
                link={`/course/${course_id}/${exam.id}/${session.id}`}
                edit_link={`/course/${course_id}/${exam.id}/${session.id}/edit_session`}
              />
            ))}
          </div>

        {/* Back Button */}
        <div className="mt-8">
          <BackButton />
        </div>

        {/* Floating Action Button - Bottom Left */}
        <Link href={`/course/${course_id}/${exam_id}/create_session`}>
          <Button 
            size="icon" 
            className="fixed bottom-40 right-40 h-24 w-24 rounded-full bg-[#008F4C] hover:bg-[#006B3F] shadow-lg border-4 border-white"
          >
            <Plus className="w-16 h-16 text-white" />
          </Button>
        </Link>

      </main>
    </div>
  )
}

