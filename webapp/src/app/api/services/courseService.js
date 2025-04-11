import { fetchApi } from "@/app/api/client";
import { ENDPOINTS  } from "@/app/api/endpoints";

export const courseService = {
    getAllCourses: async () => {
        return fetchApi(ENDPOINTS.COURSES);
    },
    
   getCoursebyID: async (courseId) => {
        return fetchApi(ENDPOINTS.COURSE(courseId));
    }
}

