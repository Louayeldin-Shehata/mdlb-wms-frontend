import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

type Role = "ADMIN" | "CREW";
type AuthUser = { id: string; email: string; role: Role };

type PrismaUserDelegate = {
  findUnique: (args: unknown) => Promise<
    | {
        id: string;
        role: Role;
        passwordHash: string | null;
        isActive: boolean;
        email: string;
      }
    | null
  >;
  create: (args: unknown) => Promise<unknown>;
};

const prismaUser = (prisma as unknown as { user: PrismaUserDelegate }).user;

function getAdminEmailSet(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Email + Password",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const emailRaw = credentials?.email;
        const passwordRaw = credentials?.password;
        const roleRaw = credentials?.role;

        if (!emailRaw || typeof emailRaw !== "string") return null;
        if (!passwordRaw || typeof passwordRaw !== "string") return null;
        if (!roleRaw || typeof roleRaw !== "string") return null;

        const email = normalizeEmail(emailRaw);
        const desiredRole = roleRaw.toUpperCase() as Role;

        // Only allow company emails for both Admin and Crew.
        if (!email.endsWith("@mdlbeast.com")) return null;

        if (desiredRole !== "ADMIN" && desiredRole !== "CREW") return null;

        const adminEmails = getAdminEmailSet();
        const isAdminEmail = adminEmails.has(email);

        // For security, only allow ADMIN login/creation for admin emails.
        if (desiredRole === "ADMIN" && !isAdminEmail) return null;

        const existing = await prismaUser.findUnique({
          where: { email },
          select: { id: true, role: true, passwordHash: true, isActive: true, email: true },
        });

        if (!existing) {
          const allowCrewSelfRegister =
            (process.env.ALLOW_CREW_SELF_REGISTER ?? "true") === "true";

          if (desiredRole !== "CREW" || !allowCrewSelfRegister) return null;

          const passwordHash = await bcrypt.hash(passwordRaw, 10);
          const created = await prismaUser.create({
            data: {
              email,
              role: desiredRole,
              passwordHash,
              isActive: true,
            },
            select: { id: true, email: true, role: true },
          });

          return created as AuthUser;
        }

        if (!existing.isActive) return null;
        if (!existing.passwordHash) return null;

        const ok = await bcrypt.compare(passwordRaw, existing.passwordHash);
        if (!ok) return null;

        return { id: existing.id, email: existing.email, role: existing.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as AuthUser;
        token.uid = u.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).role = u.role;
      }

      if (!("role" in token) && token.email) {
        const dbUser = await prismaUser.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, email: true, passwordHash: true, isActive: true },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).role = dbUser?.role ?? "CREW";
        token.uid = dbUser?.id ?? token.uid;
      }

      return token;
    },
    async session({ session, token }) {
      session.user = session.user ?? {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session.user.role = (token as any).role ?? "CREW";
      session.user.id = token.uid;
      session.user.email = token.email;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

