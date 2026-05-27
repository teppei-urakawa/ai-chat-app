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
  // 本番デバッグ用: エラーの詳細をログに出力する（原因判明後に削除）
  logger: {
    error(error: Error) {
      const cause = (error.cause as { err?: Error } | undefined)?.err
      console.error('[auth][name]', error.name)
      console.error('[auth][message]', error.message)
      console.error('[auth][cause_name]', cause?.name ?? 'none')
      console.error('[auth][cause_msg]', cause?.message ?? 'none')
      console.error('[auth][cause_stack]', cause?.stack?.split('\n').slice(0,4).join(' | ') ?? 'none')
    },
    warn(code: string) {
      console.warn('[auth][warn]', code)
    },
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
