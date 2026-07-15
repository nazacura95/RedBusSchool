"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

const links = [
  { label: "Quiénes somos", href: "#quienes-somos" },
  { label: "Niveles", href: "#niveles" },
  { label: "Galería", href: "#galeria" },
  { label: "Contacto", href: "#contacto" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="#" className="flex items-center gap-2">
          <Image src="/brand/logo-256.png" alt="Redbus School of English" width={32} height={32} className="h-8 w-8" />
          <span className="font-semibold text-neutral-900">Redbus School of English</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-700 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-primary-600">
              {link.label}
            </a>
          ))}
        </nav>

        <LinkButton href="#login" size="sm" className="hidden md:inline-flex">
          Ingresar
        </LinkButton>

        <button
          aria-label="Abrir menú"
          onClick={() => setOpen((v) => !v)}
          className="text-neutral-700 md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-neutral-200 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4 text-sm font-medium text-neutral-700">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
          </nav>
          <LinkButton href="#login" size="sm" onClick={() => setOpen(false)} className="mt-4 w-full">
            Ingresar
          </LinkButton>
        </div>
      )}
    </header>
  );
}
