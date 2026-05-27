import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { UIMessage } from 'ai'

type Props = {
  message: UIMessage
}

// UIMessage の parts から テキストを取り出す
function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { type: 'text'; text: string }).text)
    .join('')
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'
  const text = getTextContent(message)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold mr-3 shrink-0 mt-1">
          AI
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{text}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold ml-3 shrink-0 mt-1">
          あ
        </div>
      )}
    </div>
  )
}
