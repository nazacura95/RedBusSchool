"use client";

import { useState } from "react";
import { GraduationCap, BookOpen, LayoutDashboard } from "lucide-react";

const roles = [
  { label: "Alumno/a", icon: GraduationCap },
  { label: "Docente", icon: BookOpen },
  { label: "Directivo/a", icon: LayoutDashboard },
] as const;

export function LoginRolePicker() {
  const [selected, setSelected] = useState<string>(roles[0].label);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap justify-center gap-2">
        {roles.map((role) => (
          <button
            key={role.label}
            type="button"
            onClick={() => setSelected(role.label)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              selected === role.label
                ? "bg-primary-500 text-white"
                : "border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <role.icon className="h-4 w-4" />
            {role.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-neutral-500">
        Ingresá con tu cuenta de {selected}
      </p>
    </div>
  );
}
