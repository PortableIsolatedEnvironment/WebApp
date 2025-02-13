import Navbar from "../components/navbar"
import CourseCard from "../components/course-card"

export default function Page() {
  const courses = ["Sistemas de Operação", "Fundamentos de Programação", "Arquitetura de Computadores I"]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Selecione a Unidade Curricular!</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <CourseCard key={index} title={course} />
          ))}
        </div>
      </main>
    </div>
  )
}

