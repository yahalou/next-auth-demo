import NextAuth, { type DefaultSession } from "next-auth";
// The `JWT` interface can be found in the `next-auth/jwt` submodule
import { JWT } from "next-auth/jwt";
import { PrismaAdapter } from "@auth/prisma-adapter";

import authConfig from "./auth.config";
import { db } from "@/lib/db";

import { getUserById } from "@/data/user";
import { getTwoFactorConfirmationByUserId } from "./data/two-factor-confirmation";
import { getAccountByUserId } from "./data/account";

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's postal address. */
      role: "ADMIN" | "USER";
      isTwoFactorEnabled: boolean;
      id: string;
      isOAuth: boolean;
      /**
       * By default, TypeScript merges new interface properties and overwrites existing ones.
       * In this case, the default session user properties will be overwritten,
       * with the new ones defined above. To keep the default session user properties,
       * you need to add them back into the newly declared interface.
       */
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    role?: "ADMIN" | "USER";
    isTwoFactorEnabled: boolean;
    name: string | null;
    email: string;
    isOAuth: boolean;
  }
}

// https://authjs.dev/reference/next-auth 所有参数，函数
export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  // https://authjs.dev/reference/next-auth#events
  events: {
    // 这里的user和数据库是一个结构，和callback中的session和jwt不同，他们的都是undefined，这里的user可以拿到
    linkAccount: async ({ user }) => {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },

  // https://authjs.dev/reference/next-auth#callbacks
  callbacks: {
    // 这里的user和account都可以拿到，只有session和jwt中是undefined
    signIn: async ({ user, account }) => {
      if (account?.provider !== "credentials") {
        return true;
      }

      const existUser = await getUserById(user.id!);

      if (!existUser?.emailVerified) {
        return false;
      }

      if (existUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
          existUser.id
        );

        if (!twoFactorConfirmation) {
          return false;
        }

        // Delete two factor confirmation for next sign in
        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id },
        });
      }

      return true;
    },
    // session会先调用jwt
    // session默认只有email，name，image三个字段
    // 必须要在jwt函数中先加入token，再在session函数中用token的字段修改session，因为The token argument is only available when using the jwt session strategy, and the user argument is only available when using the database session strategy.
    session: async ({ session, token }) => {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role;
      }

      if (token.isTwoFactorEnabled && session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled;
      }

      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.isOAuth = token.isOAuth;
      }

      return session;
    },
    // 在signin或者 获取用户usesession的时候会调用(有缓存的时候不会调用)
    // token字段的描述直接看ts类型注解
    // jwt加密，session不加密
    jwt: async ({ token }) => {
      if (!token.sub) return token;
      const existUser = await getUserById(token.sub);
      if (!existUser) return token;

      // 只有第三方登录才会记录在account数据库中
      const existingAccount = await getAccountByUserId(existUser.id);

      // 这几个字段在每次验证时都会刷新
      // 但是像name等字段不会更新，可以在数据库中改数据进行实验
      token.isOAuth = !!existingAccount;
      token.role = existUser.role;
      token.isTwoFactorEnabled = existUser.isTwoFactorEnabled;

      // 除非指定，否则不会更新
      token.name = existUser.name;
      token.email = existUser.email;

      return token;
    },
  },
  adapter: PrismaAdapter(db),
  // 数据库model中没有session的原因：prisma不支持edge，只能用jwt
  // https://authjs.dev/concepts/session-strategies
  // https://authjs.dev/getting-started/migrating-to-v5#edge-compatibility
  session: { strategy: "jwt" },
  ...authConfig,
});
