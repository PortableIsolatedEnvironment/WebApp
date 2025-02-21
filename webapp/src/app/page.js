"use client"

import { useState } from "react"
import Navbar from "../components/navbar"
import CourseCard from "../components/course-card"
import Link from "next/link"
import CoursesData from "@/data/courses.json"

export default function Page() {

  const courses = CoursesData;

  // 🔍 State to hold search input
  const [searchQuery, setSearchQuery] = useState("");
  const query = searchQuery.trim().toLowerCase();

  // 🔍 Filter courses based on search input
  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(query) ||
    course.description.toLowerCase().includes(query)
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
            <Link key={index} href={`/course/${course.id}`}>
              <CourseCard title={course.name} description={course.description} />
            </Link>
          ))}
        </div>
       )} 
      </main>
    </div>
  );
}

