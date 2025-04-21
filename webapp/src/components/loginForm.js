"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";


export default function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Make login request to your API
      const response = await fetch("http://localhost:8000/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      // Parse the response
      const data = await response.json();

      console.log(data);

      if (!response.ok) {
        setError(t("Invalid_Credentials"));
      }

      // if role is admin or teacher redirect to /
      if (data.role === "admin" || data.role === "teacher") {
        document.cookie = `currentUser=${JSON.stringify(
          data
        )}; path=/; max-age=86400`;

        await new Promise((resolve) => setTimeout(resolve, 100));

        // Get the current locale from the URL
        const locale = window.location.pathname.split("/")[1] || "en";

        router.push(`/${locale}`);
        return;
      }
      if (data.role === "student") {
        setError("Invalid Credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid Credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-gray-700 mb-2">
          {t("Email")}
        </label>
        <input
          type="text"
          id="email"
          name="email"
          value={credentials.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-gray-700 mb-2">
          {t("Password")}
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={credentials.password}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <button
        type="Submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
      >
        {isLoading ? t("LoadLogin") : t("Login")}
      </button>
    </form>
  );
}
