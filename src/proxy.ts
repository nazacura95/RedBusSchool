import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const roleHome: Record<string, string> = {
  ALUMNO: "/alumno",
  DOCENTE: "/docente",
  DIRECTIVO: "/directivo",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  if (!user) {
    if (pathname === "/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ya logueado, mandarlo a su home si entra a / o /login
  if (pathname === "/" || pathname === "/login") {
    return NextResponse.redirect(new URL(roleHome[user.role], req.url));
  }

  // bloquear secciones de otro rol
  const section = "/" + pathname.split("/")[1];
  const allowedSection = roleHome[user.role];
  if (section.startsWith("/alumno") || section.startsWith("/docente") || section.startsWith("/directivo")) {
    if (section !== allowedSection) {
      return NextResponse.redirect(new URL(allowedSection, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
