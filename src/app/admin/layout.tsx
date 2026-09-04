import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { Avatar } from "@/components/ui/avatar";

// La sección /admin es de las cuentas de plataforma (isPlatformAdmin), no de un instituto —
// por eso tiene su propio shell en vez de AppShell/Sidebar (esos están armados para roles
// ALUMNO/DOCENTE/DIRECTIVO, que una cuenta de plataforma nunca tiene). proxy.ts ya bloquea el
// acceso a quien no sea isPlatformAdmin antes de llegar acá.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg font-bold text-neutral-900">Bedel</span>
          <span className="rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-600">Plataforma</span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar name={session?.user.name ?? "?"} size="sm" />
          <span className="text-sm font-medium text-neutral-700">{session?.user.name}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">{children}</main>
    </div>
  );
}
