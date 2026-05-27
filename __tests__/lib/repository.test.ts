import { describe, it, expect, vi, beforeEach } from 'vitest'

// withUser をモック: RLS ラッパーを透過させ、第2引数をそのまま実行する
const mockTx = {
  query: {
    conversations: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    messages: {
      findMany: vi.fn(),
    },
  },
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

vi.mock('@/lib/db/with-user', () => ({
  withUser: (_userId: string, fn: (tx: typeof mockTx) => unknown) => fn(mockTx),
}))

// drizzle のヘルパーはパス比較のため実装不要（呼ばれるだけなので）
vi.mock('@/lib/db/schema', () => ({
  conversations: 'conversations',
  messages: 'messages',
}))

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ col, val, op: 'eq' }),
  and: (...args: unknown[]) => ({ args, op: 'and' }),
  asc: (col: unknown) => ({ col, op: 'asc' }),
}))

import { conversationRepository, messageRepository } from '@/lib/chat/repository'

// ────────────────────────────────────────
// テスト用フィクスチャ
// ────────────────────────────────────────
const USER_ID = 'user-001'
const CONV_ID = 'conv-abc'

const fakeConversation = {
  id: CONV_ID,
  userId: USER_ID,
  title: 'テスト会話',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const fakeMessage = {
  id: 'msg-001',
  conversationId: CONV_ID,
  role: 'user' as const,
  content: 'こんにちは',
  createdAt: new Date('2024-01-01'),
}

// chainable な drizzle mock builder
function makeDrizzleChain(returnValue: unknown) {
  const chain: Record<string, unknown> = {}
  ;['values', 'set', 'where', 'returning'].forEach(method => {
    chain[method] = vi.fn(() => chain)
  })
  // returning() の最後の呼び出しが値を返す
  ;(chain.returning as ReturnType<typeof vi.fn>).mockResolvedValue(returnValue)
  return chain
}

// ────────────────────────────────────────
// conversationRepository のテスト
// ────────────────────────────────────────
describe('conversationRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── findAll ─────────────────────────────────

  describe('findAll', () => {
    it('ユーザーの会話一覧を返す', async () => {
      mockTx.query.conversations.findMany.mockResolvedValue([fakeConversation])

      const result = await conversationRepository.findAll(USER_ID)

      expect(result).toEqual([fakeConversation])
      expect(mockTx.query.conversations.findMany).toHaveBeenCalledOnce()
    })

    it('会話がない場合は空配列を返す', async () => {
      mockTx.query.conversations.findMany.mockResolvedValue([])

      const result = await conversationRepository.findAll(USER_ID)

      expect(result).toEqual([])
    })
  })

  // ─── findById ─────────────────────────────────

  describe('findById', () => {
    it('存在する会話を返す', async () => {
      mockTx.query.conversations.findFirst.mockResolvedValue(fakeConversation)

      const result = await conversationRepository.findById(USER_ID, CONV_ID)

      expect(result).toEqual(fakeConversation)
    })

    it('存在しない会話は undefined を返す', async () => {
      mockTx.query.conversations.findFirst.mockResolvedValue(undefined)

      const result = await conversationRepository.findById(USER_ID, 'nonexistent')

      expect(result).toBeUndefined()
    })
  })

  // ─── create ────────────────────────────────────

  describe('create', () => {
    it('新規会話を作成して返す', async () => {
      const chain = makeDrizzleChain([fakeConversation])
      mockTx.insert.mockReturnValue(chain)

      const result = await conversationRepository.create(USER_ID, 'テスト会話')

      expect(mockTx.insert).toHaveBeenCalledOnce()
      expect(result).toEqual(fakeConversation)
    })
  })

  // ─── updateTitle ───────────────────────────────

  describe('updateTitle', () => {
    it('タイトルを更新して返す', async () => {
      const updated = { ...fakeConversation, title: '新しいタイトル' }
      const chain = makeDrizzleChain([updated])
      mockTx.update.mockReturnValue(chain)

      const result = await conversationRepository.updateTitle(USER_ID, CONV_ID, '新しいタイトル')

      expect(result).toEqual(updated)
    })

    it('対象が見つからない場合は null を返す', async () => {
      const chain = makeDrizzleChain([])
      mockTx.update.mockReturnValue(chain)

      const result = await conversationRepository.updateTitle(USER_ID, 'nonexistent', 'title')

      expect(result).toBeNull()
    })
  })

  // ─── remove ────────────────────────────────────

  describe('remove', () => {
    it('会話を削除する（戻り値なし）', async () => {
      const chain: Record<string, unknown> = {}
      chain.where = vi.fn(() => Promise.resolve())
      mockTx.delete.mockReturnValue(chain)

      await expect(conversationRepository.remove(USER_ID, CONV_ID)).resolves.toBeUndefined()
      expect(mockTx.delete).toHaveBeenCalledOnce()
    })
  })
})

// ────────────────────────────────────────
// messageRepository のテスト
// ────────────────────────────────────────
describe('messageRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── findByConversation ────────────────────────

  describe('findByConversation', () => {
    it('会話が存在する場合はメッセージ一覧を返す', async () => {
      mockTx.query.conversations.findFirst.mockResolvedValue(fakeConversation)
      mockTx.query.messages.findMany.mockResolvedValue([fakeMessage])

      const result = await messageRepository.findByConversation(USER_ID, CONV_ID)

      expect(result).toEqual([fakeMessage])
    })

    it('メッセージが0件の場合は空配列を返す', async () => {
      mockTx.query.conversations.findFirst.mockResolvedValue(fakeConversation)
      mockTx.query.messages.findMany.mockResolvedValue([])

      const result = await messageRepository.findByConversation(USER_ID, CONV_ID)

      expect(result).toEqual([])
    })

    it('会話が存在しない場合は null を返す（所有権チェック）', async () => {
      mockTx.query.conversations.findFirst.mockResolvedValue(undefined)

      const result = await messageRepository.findByConversation(USER_ID, 'nonexistent')

      expect(result).toBeNull()
      // メッセージのクエリは実行されない
      expect(mockTx.query.messages.findMany).not.toHaveBeenCalled()
    })
  })

  // ─── append ────────────────────────────────────

  describe('append', () => {
    function makeAppendChain() {
      const insertChain: Record<string, unknown> = {}
      insertChain.values = vi.fn(() => Promise.resolve())

      const updateChain: Record<string, unknown> = {}
      updateChain.set = vi.fn(() => updateChain)
      updateChain.where = vi.fn(() => Promise.resolve())

      return { insertChain, updateChain }
    }

    it('メッセージを追加して会話の updatedAt を更新する', async () => {
      const { insertChain, updateChain } = makeAppendChain()
      mockTx.insert.mockReturnValue(insertChain)
      mockTx.update.mockReturnValue(updateChain)

      await expect(
        messageRepository.append(USER_ID, CONV_ID, 'user', 'テストメッセージ'),
      ).resolves.toBeUndefined()

      // insert が呼ばれている
      expect(mockTx.insert).toHaveBeenCalledOnce()
      // update（updatedAt）が呼ばれている
      expect(mockTx.update).toHaveBeenCalledOnce()
    })

    it('assistant ロールのメッセージも追加できる', async () => {
      const { insertChain, updateChain } = makeAppendChain()
      mockTx.insert.mockReturnValue(insertChain)
      mockTx.update.mockReturnValue(updateChain)

      await expect(
        messageRepository.append(USER_ID, CONV_ID, 'assistant', 'AIの回答'),
      ).resolves.toBeUndefined()

      expect(mockTx.insert).toHaveBeenCalledOnce()
    })
  })
})
