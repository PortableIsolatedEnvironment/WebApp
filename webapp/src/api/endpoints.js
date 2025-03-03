
const coursePath = (courseId) => `/course/${courseId}`;
const examPath = (courseId, examId) => `${coursePath(courseId)}/${examId}`;
const sessionPath = (courseId, examId, sessionId) => `${examPath(courseId, examId)}/${sessionId}`;

export const ENDPOINTS = {
  // Course endpoints
  COURSES: "/course",
  COURSE: coursePath,
  COURSE_CREATE: `/course/create`, // * ADMIN SIDE

  // Exam endpoints
  EXAMS: (courseId) => `${coursePath(courseId)}/exams`,
  EXAM: examPath,
  EXAM_CREATE: (courseId) => `${coursePath(courseId)}/exam/exam-create`,

  // Session endpoints
  SESSIONS: (courseId, examId) => `${examPath(courseId, examId)}/sessions`,
  SESSION: sessionPath,
  SESSION_CREATE: (courseId, examId) => `${examPath(courseId, examId)}/session/session-create`,
  SESSION_UPLOAD: (courseId, examId, sessionId) => `${sessionPath(courseId, examId, sessionId)}/upload`,
  SESSION_DOWNLOAD: (courseId, examId, sessionId) => `${sessionPath(courseId, examId, sessionId)}/download`, // * STUDENT SIDE
  SESSION_SUBMISSIONS: (courseId, examId, sessionId) => `${sessionPath(courseId, examId, sessionId)}/submissions`,
  SESSION_SUBMISSIONS_DOWNLOAD: (courseId, examId, sessionId) => `${sessionPath(courseId, examId, sessionId)}/get-submissions`,
};