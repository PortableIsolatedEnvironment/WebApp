import { fetchApi } from "@/api/client";
import { ENDPOINTS  } from "@/api/endpoints";

export const sessionService = {
    getSessions : async (courseId, examId) => {
        return fetchApi(ENDPOINTS.SESSIONS(courseId, examId));
    },

    getSession : async (courseId, examId, sessionId) => {
        return fetchApi(ENDPOINTS.SESSION(courseId, examId, sessionId));
    },

    createSession : async (courseId, examId, session) => {
        return fetchApi(ENDPOINTS.SESSION_CREATE(courseId, examId), {
            method: "POST",
            body: JSON.stringify(session),
            headers: {
                "Content-Type": "application/json",
                accept: "application/json"
            }
        });
    },
    uploadFile: async (courseId, examId, sessionId, formData) => {
        return fetchApi(ENDPOINTS.SESSION_UPLOAD(courseId, examId, sessionId), {
            method: "POST",
            body: formData,
        });
    },
    deleteSession: async (courseId, examId, sessionId) => {
        return fetchApi(ENDPOINTS.SESSION(courseId, examId, sessionId), {
            method: "DELETE",
        });
    },
    updateSession: async (courseId, examId, sessionId, session) => {
        return fetchApi(ENDPOINTS.SESSION(courseId, examId, sessionId), {
            method: "PUT",
            body: JSON.stringify(session),
            headers: {
                "Content-Type": "application/json",
                accept: "application/json"
            }
        });
    },
};
