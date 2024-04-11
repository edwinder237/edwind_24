// next
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

// third-party
import axios from "axios";

const prisma = new PrismaClient();

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET_KEY,
  providers: [
    CredentialsProvider({
      id: "login",
      name: "Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "Enter Email" },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter Password",
        },
      },
      async authorize(credentials) {
        try {
          const user = await axios.post(
            `${process.env.NEXTAUTH_URL}/api/auth/login`,
            {
              credentials,
            }
          );

          if (user) {
            return user.data;
          }
        } catch (e) {
          const errorMessage = e?.response.data.message;
          throw new Error(errorMessage);
        }
      },
    }),
    CredentialsProvider({
      id: "register",
      name: "Register",
      credentials: {
        name: { label: "Name", type: "text", placeholder: "Enter Name" },
        email: { label: "Email", type: "email", placeholder: "Enter Email" },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter Password",
        },
      },
      async authorize(credentials) {
        try {
          const user = await axios.post(
            `${process.env.NEXTAUTH_URL}/api/auth/db-create-user`,
            { credentials }
          );

          if (user) {
            return user.data;
          }
        } catch (e) {
          const errorMessage = e?.response.data.message;
          throw new Error(errorMessage);
        }
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user, account }) => {
      if (user) {
        token.id = user.id;
        token.provider = account?.provider;
        token.userProps = { sub_org: user.subOrganizationId, sub_org_name: user.subOrganizationName };
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token) {
        session.id = token.id;
        session.provider = token.provider;
        session.token = token;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: Number(process.env.JWT_TIMEOUT),
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
});
