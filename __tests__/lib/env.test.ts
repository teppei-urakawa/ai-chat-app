import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * lib/env.ts のユニットテスト
 *
 * env.ts はモジュールロード時に process.env を検証するため、
 * vi.resetModules() でキャッシュをクリアして各テストで再インポートする。
 */
describe('lib/env', () => {
  const REQUIRED_VARS = {
    GROQ_API_KEY: 'gsk_test',
    AUTH_SECRET: 'test-secret',
    AUTH_GITHUB_ID: 'github-id',
    AUTH_GITHUB_SECRET: 'github-secret',
    DATABASE_URL: 'postgresql://localhost/test',
  }

  beforeEach(() => {
    vi.resetModules()
    // 全必須変数をセット
    Object.entries(REQUIRED_VARS).forEach(([k, v]) => {
      process.env[k] = v
    })
  })

  it('全変数が揃っていれば env オブジェクトを返す', async () => {
    const { env } = await import('@/lib/env')
    expect(env.groqApiKey).toBe('gsk_test')
    expect(env.databaseUrl).toBe('postgresql://localhost/test')
    expect(env.isProd).toBe(false)
  })

  it('GROQ_API_KEY が未設定なら起動時にエラーを投げる', async () => {
    delete process.env.GROQ_API_KEY
    await expect(import('@/lib/env')).rejects.toThrow('GROQ_API_KEY')
  })

  it('DATABASE_URL が空文字なら起動時にエラーを投げる', async () => {
    process.env.DATABASE_URL = ''
    await expect(import('@/lib/env')).rejects.toThrow('DATABASE_URL')
  })

  it('AUTH_SECRET が未設定なら起動時にエラーを投げる', async () => {
    delete process.env.AUTH_SECRET
    await expect(import('@/lib/env')).rejects.toThrow('AUTH_SECRET')
  })
})
