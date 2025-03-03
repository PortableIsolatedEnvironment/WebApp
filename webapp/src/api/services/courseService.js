import { fetchApi } from "@/api/client";
import { ENDPOINTS  } from "@/api/endpoints";

export const courseService = {
    getAllCourses: async () => {
        return fetchApi(ENDPOINTS.COURSES);
    }
}