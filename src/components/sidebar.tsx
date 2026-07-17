"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { GraduationCap, BookOpen, LayoutDashboard, BarChart3, Camera, Users, School, UserPlus, LucideIcon } from "lucide-react";

const directivoExtras = [
  { label: "Alumnos", href: "/directivo/alumnos", icon: Users },
  { label: "Admisiones", href: "/directivo/admisiones", icon: UserPlus },
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

function navLinkClass(active: boolean) {
  return `relative flex items-center gap-3 rounded-md border-l-[3px] px-3 py-2.5 text-sm transition-colors ${
    active
      ? "border-primary-500 bg-white/8 font-semibold text-white"
      : "border-transparent text-accent-100 hover:bg-white/8 hover:text-white"
  }`;
}

export function Sidebar({ roles, onNavigate }: { roles: Role[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = roleOrder.filter((r) => roles.includes(r)).map((r) => roleNav[r]);

  return (
    <div className="flex h-full w-[232px] flex-col gap-1 bg-accent-600 p-3.5">
      <div className="flex items-center gap-2 px-2.5 pb-5 pt-1.5">
        <Image src="/brand/logo-256.png" alt="Redbus School of English" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full" />
        <span className="truncate font-serif text-base font-bold text-white">Redbus School</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate} className={navLinkClass(active)}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        {roles.includes("DIRECTIVO") &&
          directivoExtras.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={onNavigate} className={navLinkClass(active)}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
