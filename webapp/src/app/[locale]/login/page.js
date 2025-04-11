'use client';

import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function LoginPage() {
  const t = useTranslations();
  
  // Prevent body scrolling when this component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center" 
      style={{
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}>
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-4xl font-bold mb-8 text-center">{t("Login")}</h1>
        
        <Button
          onClick={() => signIn("ua", { callbackUrl: `/en`, redirect: true })}
          className="w-full"
        >
          Click to login with idP UA
        </Button>
      </div>
    </div>
  );
}