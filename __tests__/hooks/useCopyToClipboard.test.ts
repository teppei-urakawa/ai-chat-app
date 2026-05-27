import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    // navigator.clipboard をモック
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ─── happy path ──────────────────────────────

  it('コピー成功: isCopied が true になる', async () => {
    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copy('テストテキスト')
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('テストテキスト')
    expect(result.current.isCopied).toBe(true)
  })

  it('2秒後に isCopied が false にリセットされる', async () => {
    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copy('テキスト')
    })
    expect(result.current.isCopied).toBe(true)

    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current.isCopied).toBe(false)
  })

  it('resetDelay を変更するとその時間後にリセットされる', async () => {
    const { result } = renderHook(() => useCopyToClipboard(500))

    await act(async () => {
      await result.current.copy('テキスト')
    })

    act(() => { vi.advanceTimersByTime(499) })
    expect(result.current.isCopied).toBe(true)

    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current.isCopied).toBe(false)
  })

  // ─── error case ──────────────────────────────

  it('writeText が reject しても isCopied は false のまま（クラッシュしない）', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Permission denied'))

    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copy('テキスト')
    })

    expect(result.current.isCopied).toBe(false)
  })

  // ─── edge case ───────────────────────────────

  it('navigator.clipboard が存在しない環境では何もしない', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      // エラーが投げられないことを確認
      await result.current.copy('テキスト')
    })

    expect(result.current.isCopied).toBe(false)
  })

  it('連打しても最後の1回のタイマーだけが有効（前のタイマーはキャンセル）', async () => {
    const { result } = renderHook(() => useCopyToClipboard(2000))

    // 1回目のコピー
    await act(async () => { await result.current.copy('1回目') })

    // 1秒後に2回目のコピー（タイマーリセットされるはず）
    act(() => { vi.advanceTimersByTime(1000) })
    await act(async () => { await result.current.copy('2回目') })

    // 2回目から2秒経つ前はまだ true
    act(() => { vi.advanceTimersByTime(1999) })
    expect(result.current.isCopied).toBe(true)

    // 2回目から2秒後に false
    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current.isCopied).toBe(false)
  })
})
