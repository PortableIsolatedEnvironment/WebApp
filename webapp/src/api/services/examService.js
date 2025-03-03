import { fetchApi } from "@/api/client";
import { ENDPOINTS  } from "@/api/endpoints";

export const examService = {
    getExams : async (courseId) => {
        return fetchApi(ENDPOINTS.EXAMS(courseId));
    }
}