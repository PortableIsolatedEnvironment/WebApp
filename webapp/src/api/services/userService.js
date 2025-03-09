import { fetchApi } from "@/api/client";
import { ENDPOINTS  } from "@/api/endpoints";
import { get } from "react-hook-form";

export const userService = {
    getUsers : async () => {
        return fetchApi(ENDPOINTS.USERS);
    },
    getUser: async (userId) => {
        return fetchApi(ENDPOINTS.USER(userId));
    },
    loginUser: async (user) => {
        return fetchApi(ENDPOINTS.USER_LOGIN, {
            method: "POST",
            body: JSON.stringify(user),
            headers: {
                "Content-Type": "application/json",
                accept: "application/json"
            }
        });
    }
};