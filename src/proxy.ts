import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

const roleHome: Record<Role, string> = {
  DIRECTIVO: "/directivo",
  DOCENTE: "/docente",
  ALUMNO: "/alumno",
};

// orden de preferencia para elegir el home "default" cuando el usuario tiene varios roles
const roleHomePriority: Role[] = ["DIRECTIVO", "DOCENTE", "ALUMNO"];

function defaultHome(roles: Role[]) {
  const preferred = roleHomePriority.find((r) => roles.includes(r));
  return roleHome[preferred ?? roles[0]];
}

const publicPaths = ["/", "/login", "/recuperar"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;
  // sesiones firmadas antes del cambio a roles múltiples no traen `roles` (array) —
  // tratarlas como no autenticadas en vez de romper, para forzar un nuevo login.
  const roles = Array.isArray(user?.roles) ? user.roles : [];

  if (!user || roles.length === 0) {
    if (publicPaths.includes(pathname)) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ya logueado: la home pública/login lo mandan a su dashboard
  if (publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL(defaultHome(roles), req.url));
  }

  // bloquear secciones de un rol que no tiene
  const section = "/" + pathname.split("/")[1];
  const sectionRole = (Object.keys(roleHome) as Role[]).find((r) => roleHome[r] === section);
  if (sectionRole && !roles.includes(sectionRole)) {
    return NextResponse.redirect(new URL(defaultHome(roles), req.url));
  }

  return NextResponse.next();
});

export const config = {
  // excluye rutas de API, assets internos de Next y cualquier archivo estático de /public
  // (logo, favicon, manifest, service worker, etc.) — un archivo de /public nuevo que no
  // matchee esta lista queda igual de "invisible" (redirige a /login) que le pasó al logo.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|json|js)$).*)"],
};
