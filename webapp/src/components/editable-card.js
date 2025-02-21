'use client'; 
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

export default function TestCard({ name, description, link, edit_link,}) {
  return (
    <div className="group relative rounded-lg border bg-[#1C1C1C] p-6 hover:bg-[#242424] transition-colors">
      <Link href={link} className="block cursor-pointer">
        <div>
          <h2 className="text-lg font-semibold text-white">{name}</h2>
          <p className="mt-2 text-sm text-gray-400">{description}</p>
        </div>
      </Link>

      {/* Botão de Editar */}
      <Link href={edit_link} >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-12 text-white"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </Link>

      {/* Botão de Apagar */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white opacity-60 hover:opacity-100"
        onClick={() => {
          alert("Exam Deleted (TO BE IMPLEMENTED)");
        }}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
