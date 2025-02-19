
import { notFound } from "next/navigation";
import Navbar from "../../../components/navbar";
import CourseCard from "../../../components/course-card";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import BackButton from "@/components/back-button";


async function getCourseData(id) {
  // Simulate fetching from a database (Replace this with real DB query)
  const courses = [
    {
      id: "sistemas-de-operacao",
      title: "Sistemas de Operação",
      tests: [
        { title: "Teste Prático 24/25", description: "Description" },
        { title: "Teste Treino 24/25", description: "Description" },
        { title: "Teste Teorico 24/25", description: "Description" },
      ],
    },
    {
      id: "fundamentos-de-programacao",
      title: "Fundamentos de Programação",
      tests: [
        { title: "Teste Prático FP", description: "Description" },
        { title: "Teste Treino FP", description: "Description" },
      ],
    },
    {
      id: "arquitetura-de-computadores-1",
      title: "Arquitetura de Computadores I",
      tests: [
        { title: "Teste Prático AC1", description: "Description" },
      ],
    },
    {
      id: "compiladores",
      title: "Compiladores",
      tests: [
        { title: "Teste Prático Comp", description: "Description" },
      ],
    },
  ];

  return courses.find(course => course.id === id) || null; // Ensure it matches the id format
}


export default async function CoursePage({ params }) {
  const { id } = await params;
  const course = await getCourseData(id); // Fetch course from DB

  if (!course) {
    return notFound(); // Show 404 if course doesn't exist
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">{course.title}</h1>

        {/* Dynamically Generate Test Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {course.tests.map((test, index) => (
            <CourseCard key={index} title={test.title} description={test.description}>
              <div className="group relative rounded-lg border bg-[#1C1C1C] p-6 hover:bg-[#242424] transition-colors">
                {/* Clicking this div navigates */}
                <Link href={`/course/${id}/test/${index}`}>
                  <div className="flex items-center justify-between cursor-pointer">
                    <h2 className="text-lg font-semibold text-white">{test.title}</h2>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">{test.description}</p>
                </Link>

                {/* Buttons remain outside Link */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <Button variant="ghost" size="icon" className="text-white">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CourseCard>
          ))}
        </div>

        <div className="mt-8">
        <BackButton />
        </div>

        {/* Floating Action Button */}
        <Link href={`/course/${course.id}/create`}>
          <Button size="icon" className="fixed bottom-10 right-10 h-20 w-20 rounded-full bg-[#006B3F] hover:bg-[#005832]">
            <Plus size={60} className="h-20 w-20" />
          </Button>
          </Link>
      </main>
    </div>
    );
  }
