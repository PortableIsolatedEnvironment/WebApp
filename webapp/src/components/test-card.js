"use client"; // Garantir que este é um Client Component

import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

export default function TestCard({ title, description, link, onEdit, onDelete }) {
  return (
    <div className="group relative rounded-lg border bg-[#1C1C1C] p-6 hover:bg-[#242424] transition-colors">
      {/* Link envolve tudo, mas os botões não acionam o redirecionamento */}
      <Link href={link || "#"} passHref className="block cursor-pointer">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-2 text-sm text-gray-400">{description}</p>
        </div>
      </Link>

      {/* Botão de Editar */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-12 text-white"
        onClick={(e) => {
          e.stopPropagation(); // Impede que o clique ative o link
          e.preventDefault();
          if (onEdit) onEdit();
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>

      {/* Botão de Apagar */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white opacity-60 hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation(); // Impede que o clique ative o link
          e.preventDefault();
          if (onDelete) onDelete();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
