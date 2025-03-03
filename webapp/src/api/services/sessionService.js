import { fetchApi } from "@/api/client";
import { ENDPOINTS  } from "@/api/endpoints";

export const sessionService = {
    getSessions : async (courseId, examId) => {
        return fetchApi(ENDPOINTS.SESSIONS(courseId, examId));
    },
    getSession : async (courseId, examId, sessionId) => {
        return fetchApi(ENDPOINTS.SESSION(courseId, examId, sessionId));
    }
}