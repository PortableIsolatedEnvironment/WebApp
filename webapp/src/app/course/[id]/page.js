
import { notFound } from "next/navigation";
import Navbar from "../../../components/navbar";
import TestList from "../../../components/test-list";
import Link from "next/link";
import { Plus} from "lucide-react"
import { Button } from "@/components/ui/button"
import BackButton from "@/components/back-button";


async function getCourseData(id) {
  // Simulate fetching from a database (Replace this with real DB query)
  const courses = [
    {
      id: "sistemas-de-operacao",
      title: "Sistemas de Operação",
      tests: [
        { id: "0", title: "Teste Prático 24/25", description: "Description" },
        { id: "1", title: "Teste Treino 24/25", description: "Description" },
        { id: "2", title: "Teste Teorico 24/25", description: "Description" },
      ],
    },
    {
      id: "fundamentos-de-programacao",
      title: "Fundamentos de Programação",
      tests: [
        { id: "0", title: "Teste Prático FP", description: "Description" },
        { id: "1", title: "Teste Treino FP", description: "Description" },
      ],
    },
    {
      id: "arquitetura-de-computadores-1",
      title: "Arquitetura de Computadores I",
      tests: [
        { id: "0", title: "Teste Prático AC1", description: "Description" },
      ],
    },
    {
      id: "compiladores",
      title: "Compiladores",
      tests: [
        { id: "0", title: "Teste Prático Comp", description: "Description" },
      ],
    },
  ];

  return courses.find(course => course.id === id) || null;
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
        <TestList tests={course.tests} courseId={id} />

        {/* Back Button */}
        <div className="mt-8">
          <BackButton />
        </div>

        {/* Floating Action Button - Bottom Left */}
        <Link href={`/course/${course.id}/create`}>
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
