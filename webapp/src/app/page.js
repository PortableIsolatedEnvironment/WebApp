"use client"

import { useState } from "react"
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


  // 🔍 State to hold search input
  const [searchQuery, setSearchQuery] = useState("");
  const query = searchQuery.trim().toLowerCase();

  // 🔍 Filter courses based on search input
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(query) ||
    course.description.toLowerCase().includes(query) ||
    course.slug.toLowerCase().includes(query)
  );
  


  return (
    <div className="min-h-screen bg-white">
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Selecione a Unidade Curricular!</h1>

        {filteredCourses.length == 0 ?(
          <p className="text-center text-gray-500"> Nenhuma Unidade Curricular Encontrada.</p>
        ):(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <Link key={index} href={`/course/${course.slug}`}>
              <CourseCard title={course.title} description={course.description} />
            </Link>
          ))}
        </div>
       )} 
      </main>
    </div>
  )
}

