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
const PLATFORM_HOME = "/admin";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  if (!user) {
    if (publicPaths.includes(pathname)) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const isPlatformAdmin = user.isPlatformAdmin === true;
  // sesiones firmadas antes del cambio a roles múltiples no traen `roles` (array) —
  // tratarlas como no autenticadas en vez de romper, para forzar un nuevo login. Una cuenta
  // de plataforma legítimamente no tiene ninguno de estos tres roles, así que se excluye de
  // este chequeo (si no, quedaría atrapada como "sesión corrupta").
  const roles = Array.isArray(user.roles) ? user.roles : [];
  if (!isPlatformAdmin && roles.length === 0) {
    if (publicPaths.includes(pathname)) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ya logueado: la home pública/login lo mandan a su dashboard
  if (publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL(isPlatformAdmin ? PLATFORM_HOME : defaultHome(roles), req.url));
  }

  const section = "/" + pathname.split("/")[1];

  if (isPlatformAdmin) {
    // /admin es la única sección de una cuenta de plataforma — no tiene rol de instituto,
    // así que /directivo, /docente y /alumno le quedan bloqueados aunque esté logueada.
    if (section !== PLATFORM_HOME && (Object.values(roleHome) as string[]).includes(section)) {
      return NextResponse.redirect(new URL(PLATFORM_HOME, req.url));
    }
    return NextResponse.next();
  }

  // usuario de instituto: /admin le queda bloqueado, y las secciones de un rol que no tiene también.
  if (section === PLATFORM_HOME) {
    return NextResponse.redirect(new URL(defaultHome(roles), req.url));
  }
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
