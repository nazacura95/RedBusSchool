"use client";

import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Avatar } from "./ui/avatar";
import { LogoutButton } from "./logout-button";
import { ToastProvider } from "./ui/toast";

type Role = "ALUMNO" | "DOCENTE" | "DIRECTIVO";

export function AppShellClient({
  roles,
  name,
  title,
  orgName,
  logoUrl,
  children,
}: {
  roles: Role[];
  name: string;
  title: string;
  orgName: string;
  logoUrl: string | null;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ToastProvider>
    <div className="min-h-screen bg-neutral-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block">
        <Sidebar roles={roles} orgName={orgName} logoUrl={logoUrl} />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-neutral-900/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-50 h-full w-[232px]">
            <button
              aria-label="Cerrar menú"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 z-10 text-neutral-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar roles={roles} orgName={orgName} logoUrl={logoUrl} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-[232px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Abrir menú"
              onClick={() => setDrawerOpen(true)}
              className="text-neutral-500 hover:text-neutral-900 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-100"
            >
              <Avatar name={name} size="sm" />
              <span className="hidden text-sm font-medium text-neutral-700 sm:inline">{name}</span>
              <ChevronDown className="h-4 w-4 text-neutral-400" />
            </button>
            {menuOpen && (
              <>
                <button
                  aria-label="Cerrar"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-neutral-200 bg-white py-1 shadow-md">
                  <span className="block cursor-not-allowed px-4 py-2 text-sm text-neutral-400">Mi perfil</span>
                  <div className="border-t border-neutral-100">
                    <LogoutButton />
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:px-8">{children}</main>
      </div>
    </div>
    </ToastProvider>
  );
}
