import { notFound } from "next/navigation";

async function getExamData(courseSlug, examId) {
  // Exampe data for exams
  const exams = {
    "sistemas-de-operacao": {
      "1": { title: "Teste 1" },
      "2": { title: "Teste 2" },
    },
    "fundamentos-de-programacao": {
      "1": { title: "Teste 1" },
      "2": { title: "Teste 2" },
    },
  };
  return exams[courseSlug]?.[examId] || null;
}

export default async function ExamPage({ params }) {
  const { slug, exam_id } = await params;
  const exam = await getExamData(slug, exam_id);

  if (!exam) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold">{exam.title}</h1>
    </div>
  );
}