import Navbar from "../components/navbar"
import CourseCard from "../components/course-card"
import Link from "next/link"

export default function Page() {
  const courses = [
    {
      title: "Sistemas de Operação",
      description: "42509-so",
      slug: "sistemas-de-operacao"
    },
    {
      title: "Fundamentos de Programação",
      description: "3224-fp",
      slug: "fundamentos-de-programacao"
    },
    {
      title: "Arquitetura de Computadores I",
      description: "41948-ac-1",
      slug: "arquitetura-de-computadores-1"
    },
    {
      title: "Compiladores",
      description: "41469-c",
      slug: "compiladores"
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Selecione a Unidade Curricular!</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <Link key={index} href={'/courses/${course.slug}'}>
              <CourseCard title={course.title} description={course.description} />
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

