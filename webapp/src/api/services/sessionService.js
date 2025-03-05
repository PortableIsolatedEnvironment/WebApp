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
            const response = fetchApi(ENDPOINTS.SESSION_CREATE(courseId, examId), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
                body: JSON.stringify(session),
            });
            return response
    },
    uploadFile: async (courseId, examId, sessionId, formData) => {
        const url = ENDPOINTS.SESSION_UPLOAD(courseId, examId, sessionId);
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    accept: "application/json",
                },
                body: formData,
            });
            return response;
    },
    deleteSession: async (courseId, examId, sessionId) => {
        const response = fetchApi(ENDPOINTS.SESSION_DELETE(courseId, examId, sessionId), {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });
        return response;
    },
};