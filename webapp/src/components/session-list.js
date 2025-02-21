"use client"; // Ensures this is a Client Component

import TestCard from "./exam-card";
import { useState } from "react";

export default function TestSession({ sessions, courseId }) {
  const [sessionList, setSessionList] = useState(sessions);

  const handleEdit = (sessionId) => {
    alert(`Edit session ID: ${sessionId}`);
  };

  const handleDelete = (sessionId) => {
    if (confirm("Are you sure you want to delete this session?")) {
      setSessionList(sessionList.filter(session => session.id !== sessionId));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessionList.map((session, index) => (
        <TestCard
          key={session.id || index}
          title={session.title}
          description={session.description}
          link={`/course/${courseId}/session/${index}`}
          onEdit={() => handleEdit(session.id)}
          onDelete={() => handleDelete(session.id)}
        />
      ))}
    </div>
  );
}
