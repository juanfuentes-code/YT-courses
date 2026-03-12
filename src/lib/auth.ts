import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // JWT strategy so the middleware can verify sessions without hitting the DB
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      // Persist the user DB id in the JWT on first sign-in
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      // Forward the DB id from the token to the session
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
