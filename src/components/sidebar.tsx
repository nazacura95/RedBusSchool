"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { GraduationCap, BookOpen, LayoutDashboard, BarChart3, Camera, Users, School, LucideIcon } from "lucide-react";

const directivoExtras = [
  { label: "Alumnos", href: "/directivo/alumnos", icon: Users },
  { label: "Docentes", href: "/directivo/docentes", icon: GraduationCap },
  { label: "Aulas", href: "/directivo/aulas", icon: School },
  { label: "Galería", href: "/directivo/galeria", icon: Camera },
  { label: "Reportes", href: "/directivo/reportes", icon: BarChart3 },
];

type Role = "ALUMNO" | "DOCENTE" | "DIRECTIVO";

const roleNav: Record<Role, { label: string; href: string; icon: LucideIcon }> = {
  DIRECTIVO: { label: "Panel de Dirección", href: "/directivo", icon: LayoutDashboard },
  DOCENTE: { label: "Mis aulas", href: "/docente", icon: BookOpen },
  ALUMNO: { label: "Mi panel", href: "/alumno", icon: GraduationCap },
};

const roleOrder: Role[] = ["DIRECTIVO", "DOCENTE", "ALUMNO"];

export function Sidebar({ roles, onNavigate }: { roles: Role[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = roleOrder.filter((r) => roles.includes(r)).map((r) => roleNav[r]);

  return (
    <div className="flex h-full w-64 flex-col bg-neutral-900 text-neutral-300">
      <div className="flex h-16 items-center gap-2 border-b border-neutral-800 px-5">
        <Image src="/brand/logo-256.png" alt="Redbus School of English" width={28} height={28} className="h-7 w-7 shrink-0" />
        <span className="truncate font-bold text-white">Redbus School</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-500/15 text-primary-400"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              {active && <span className="absolute -left-3 top-0 h-full w-[3px] rounded-r bg-primary-500" />}
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        {roles.includes("DIRECTIVO") &&
          directivoExtras.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-500/15 text-primary-400"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                {active && <span className="absolute -left-3 top-0 h-full w-[3px] rounded-r bg-primary-500" />}
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
