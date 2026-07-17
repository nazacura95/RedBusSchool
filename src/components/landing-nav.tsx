"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-neutral-50/92 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/logo-256.png" alt="Redbus School" width={44} height={44} className="h-11 w-11 rounded-full" />
          <span className="font-serif text-[19px] font-bold text-neutral-800">
            Redbus <span className="text-primary-500">School</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-[15px] font-medium text-neutral-800 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-primary-500">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LinkButton href="/login" variant="secondary">
            Ingresar
          </LinkButton>
          <LinkButton href="#contacto" variant="primary">
            Inscribirme
          </LinkButton>
        </div>

        <button
          aria-label="Abrir menú"
          onClick={() => setOpen((v) => !v)}
          className="text-accent-500 md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4 text-[15px] font-medium text-neutral-800">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <LinkButton href="/login" variant="secondary" className="w-full">
              Ingresar
            </LinkButton>
            <LinkButton href="#contacto" variant="primary" className="w-full" onClick={() => setOpen(false)}>
              Inscribirme
            </LinkButton>
          </div>
        </div>
      )}
    </header>
  );
}
