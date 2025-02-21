"use client"; // This makes it a Client Component

import TestCard from "./test-card";
import { useState } from "react";

export default function TestList({ tests, courseId }) {
  const [testList, setTestList] = useState(tests);

  const handleEdit = (testId) => {
    alert(`Edit test ID: ${testId}`);
  };

  const handleDelete = (testId) => {
    if (confirm("Are you sure you want to delete this test?")) {
      setTestList(testList.filter(test => test.id !== testId));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testList.map((test, index) => (
        <TestCard
          key={test.id || index}
          title={test.title}
          description={test.description}
          link={`/course/${courseId}/${test.id}`} // FIXED: Now links to correct exam_id
          onEdit={() => handleEdit(test.id)}
          onDelete={() => handleDelete(test.id)}
        />
      ))}
    </div>
  );
}
