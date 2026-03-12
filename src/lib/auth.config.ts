import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Lightweight config — no Prisma, safe for Edge Runtime (middleware)
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: { signIn: "/" },
} satisfies NextAuthConfig;
