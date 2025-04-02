import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LoginForm from "@/components/loginForm";

export default async function LoginPage() {
  const t = await getTranslations();
  
  return (
    <div className="min-h-screen flex items-center justify-center" 
         style={{
           backgroundImage: "url('/background.jpg')",
           backgroundSize: "cover",
           backgroundPosition: "center"
         }}>
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-4xl font-bold mb-8 text-center">{t("Login")}</h1>
        
        <LoginForm />
      </div>
    </div>
  );
}