import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";
import type { Role } from "@prisma/client";

const ENABLED_RECHECK_MS = 5 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const allowed = await checkRateLimit(`login:${email.trim().toLowerCase()}`);
        if (!allowed) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.enabled) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        await clearRateLimit(`login:${email.trim().toLowerCase()}`);
        return { id: user.id, email: user.email, name: user.name, roles: user.roles };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.enabledCheckedAt = Date.now();
        return token;
      }

      // re-chequea enabled contra la base cada 5 min como máximo: si deshabilitaron la cuenta
      // (despido, conflicto), la sesión JWT (hasta 30 días) queda sin roles y proxy.ts la trata
      // como no autenticada en vez de confiar ciegamente en lo que dice el token viejo.
      const tokenId = token.id as string | undefined;
      const checkedAt = (token.enabledCheckedAt as number | undefined) ?? 0;
      if (tokenId && Date.now() - checkedAt > ENABLED_RECHECK_MS) {
        const dbUser = await prisma.user.findUnique({
          where: { id: tokenId },
          select: { enabled: true, roles: true },
        });
        token.roles = dbUser?.enabled ? dbUser.roles : [];
        token.enabledCheckedAt = Date.now();
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as Role[];
      }
      return session;
    },
  },
});
