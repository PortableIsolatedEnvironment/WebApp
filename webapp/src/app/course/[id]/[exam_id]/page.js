import BackButton from "@/components/back-button"
import Navbar from "@/components/navbar"
import TestSession from "@/components/session-list"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"

async function getCourseData(id) {
  const courses = [
    {
      id: "sistemas-de-operacao",
      title: "Sistemas de Operação",
      tests: [
        {
          id: "0", // Matches exam_id
          title: "Teste Prático 24/25",
          sessions: [
            { id: "session-1", title: "Session 1", description: "Description" },
            { id: "session-2", title: "Session 2", description: "Description" },
          ],
        },
      ],
    },
  ];

  return courses.find(course => course.id === id) || null;
}


export default async function ExamPage({ params }) {
  console.log("Params received:", params); // Debugging
  const { id, exam_id } = params;

  const course = await getCourseData(id);
  if (!course) return notFound();

  // Find the specific exam
  const exam = course.tests.find(test => test.id === exam_id);
  if (!exam) return notFound();


  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">{exam.title}</h1>

        {/* Test Sessions */}
        <TestSession sessions={sessions} />

        {/* Back Button */}
        <div className="mt-8">
          <BackButton />
        </div>

        {/* Floating Action Button - Bottom Left */}
        <Link href={`/course/${id}/${exam_id}/create_session`}>
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

