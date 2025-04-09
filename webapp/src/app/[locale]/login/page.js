'use client';

// import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"
import { getLocale } from "next-intl/server";

// import LoginForm from "@/components/loginForm";

export default function LoginPage() {
  // const t = await getTranslations();
  
  return (
    <div className="min-h-screen flex items-center justify-center" 
         style={{
           backgroundImage: "url('/background.jpg')",
           backgroundSize: "cover",
           backgroundPosition: "center"
         }}>
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        {/* <h1 className="text-4xl font-bold mb-8 text-center">{t("Login")}</h1> */}
        
        {/* <LoginForm /> */}

        <Button
          onClick={() => signIn("ua", { redirectTo: `/${locale}/`, redirect: true })}
          className="w-full"
        />
      </div>
    </div>
  );
}