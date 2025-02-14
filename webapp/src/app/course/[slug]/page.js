// app/courses/[slug]/page.js
import { notFound } from "next/navigation";

async function getCourseData(slug) {
  // Simulate fetching from a database (Replace this with real DB query)
  const courses = {
    "sistemas-de-operacao": {
      title: "Sistemas de Operação",
      description: "Learn about OS fundamentals.",
    },
    "fundamentos-de-programacao": {
      title: "Fundamentos de Programação",
      description: "Introduction to programming basics.",
    },
    "arquitetura-de-computadores-1": {
      title: "Arquitetura de Computadores I",
      description: "Study the architecture of modern computers.",
    },
  };

  return courses[slug] || null; // Return course data or null if not found
}

export default async function CoursePage({ params }) {
  const { slug } = await params;
  const course = await getCourseData(slug); // Fetch course from DB

  if (!course) {
    return notFound(); // Show 404 if course doesn't exist
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold">{course.title}</h1>
      <p className="text-gray-600">{course.description}</p>
    </div>
  );
}
