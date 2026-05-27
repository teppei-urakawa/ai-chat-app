import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from './db'
import { accounts, sessions, users, verificationTokens } from './db/schema'
import { env } from './env'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GitHub({
      // env経由で取得することで、未設定時に起動時エラーになる
      clientId: env.githubClientId,
      clientSecret: env.githubClientSecret,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
