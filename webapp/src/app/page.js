import Navbar from "../components/navbar"
import CourseCard from "../components/course-card"
import Link from "next/link"
import CoursesData from "@/data/courses.json"
import { courseService } from "@/api/services/courseService"

export default async function CoursesPage() {

  let courses = [];

  try {
    courses = await courseService.getAllCourses();
  }
  catch (error) {
    console.error(error);
  }
  
  return (
    <div className="min-h-screen bg-white">
      {/* <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} /> */}

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Select the Course</h1>

        {/* {filteredCourses.length == 0 ?(
          <p className="text-center text-gray-500"> Nenhuma Unidade Curricular Encontrada.</p>
        ):( */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <Link key={index} href={`/course/${course.id}`}>
              <CourseCard title={course.name} description={course.id} />
            </Link>
          ))}
        </div>
       {/* )}  */}
      </main>
    </div>
  );
}

