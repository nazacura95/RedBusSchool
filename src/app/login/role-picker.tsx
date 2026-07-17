"use client";

import { useState } from "react";
import { GraduationCap, BookOpen, LayoutDashboard } from "lucide-react";

type Role = "Alumno/a" | "Docente" | "Directivo/a";

const roles: { label: Role; icon: typeof GraduationCap }[] = [
  { label: "Alumno/a", icon: GraduationCap },
  { label: "Docente", icon: BookOpen },
  { label: "Directivo/a", icon: LayoutDashboard },
];

export function RolePicker() {
  const [role, setRole] = useState<Role>("Alumno/a");

  return (
    <>
      <div className="mt-5 flex justify-center gap-1 rounded-full bg-neutral-100 p-1">
        {roles.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => setRole(r.label)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              role === r.label ? "bg-accent-500 text-white" : "text-neutral-700 hover:text-neutral-900"
            }`}
          >
            <r.icon className="h-4 w-4" />
            {r.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-neutral-600">Ingresá con tu cuenta de {role}</p>
    </>
  );
}
