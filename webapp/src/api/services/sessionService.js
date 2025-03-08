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
    getSessionUsers: async (sessionId) => {
        return fetchApi(ENDPOINTS.SESSION_USER(sessionId));
    },
    downloadSubmissions: async (courseId, examId, sessionId) => {
        const endpoint = ENDPOINTS.SESSION_SUBMISSIONS_DOWNLOAD(courseId, examId, sessionId);
        
        try {
            const response = await fetch(endpoint, {
                method: "GET",
                headers: { "Accept": "application/zip" },
                credentials: "include"
            });
    
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
    
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/zip")) {
                throw new Error(`Unexpected content type: ${contentType}`);
            }
    
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `submissions-${sessionId}.zip`;
    
            document.body.appendChild(a);
            a.click();
    
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
    
            return true;
        } catch (error) {
            console.error("Error downloading submissions:", error);
            throw error;
        }
    }
};
