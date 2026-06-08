import { UserRole } from "@prisma/client";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { db } from "@/lib/db";
import { generateUniqueUsername } from "@/lib/usernames";

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development" ? "dev-only-auth-secret-change-me" : undefined);

export const googleAuthConfigured = Boolean(
  process.env.NODE_ENV !== "development" &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET,
);

function displayNameFromEmail(email: string) {
  return email.split("@")[0] ?? "Traveler";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(googleAuthConfigured
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const email =
          typeof rawCredentials?.email === "string" ? rawCredentials.email.toLowerCase().trim() : "";
        const password = typeof rawCredentials?.password === "string" ? rawCredentials.password : "";

        if (!email || !password) {
          return null;
        }

        const user = (await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            passwordHash: true,
            isBanned: true,
          },
        })) as {
          id: string;
          email: string;
          displayName: string;
          role: UserRole;
          passwordHash: string | null;
          isBanned: boolean;
        } | null;

        if (!user || !user.passwordHash || user.isBanned) {
          return null;
        }

        const isValidPassword = await compare(password, user.passwordHash);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = typeof profile?.email === "string" ? profile.email.toLowerCase().trim() : "";

      if (!email) {
        return false;
      }

      const existingUser = (await db.user.findUnique({
        where: { email },
        select: { id: true, isBanned: true },
      })) as { id: string; isBanned: boolean } | null;

      if (existingUser?.isBanned) {
        return false;
      }

      if (!existingUser) {
        const profileName = typeof profile?.name === "string" ? profile.name.trim() : "";
        const displayName = profileName || displayNameFromEmail(email);
        const username = await generateUniqueUsername(displayName);

        await db.user.create({
          data: {
            email,
            username,
            displayName,
            avatarUrl: null,
            bio: null,
            location: null,
            role: UserRole.user,
            passwordHash: null,
            isBanned: false,
          },
        });
      }

      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (
        account?.provider === "google" &&
        profile &&
        typeof (profile as Record<string, unknown>).picture === "string"
      ) {
        token.oauthAvatarUrl = (profile as Record<string, string>).picture;
      }

      const lookupEmail =
        typeof user?.email === "string" ? user.email.toLowerCase().trim() : token.email?.toLowerCase().trim();

      if (!lookupEmail) {
        return token;
      }

      const dbUser = (await db.user.findUnique({
        where: { email: lookupEmail },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
        },
      })) as {
        id: string;
        email: string;
        displayName: string;
        role: UserRole;
      } | null;

      if (!dbUser) {
        return token;
      }

      token.sub = dbUser.id;
      token.email = dbUser.email;
      token.name = dbUser.displayName;
      token.role = dbUser.role;

      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.id = token.sub ?? "";
      session.user.role = token.role === UserRole.admin ? UserRole.admin : UserRole.user;
      session.user.oauthAvatarUrl = typeof token.oauthAvatarUrl === "string" ? token.oauthAvatarUrl : null;

      return session;
    },
  },
});
