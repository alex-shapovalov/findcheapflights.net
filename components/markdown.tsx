import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'

const components = {
  h1: ({ children }) => (
    <h2 className="mt-8 font-display text-2xl tracking-tight text-foam first:mt-0">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h2 className="mt-8 font-display text-xl tracking-tight text-foam first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 font-medium text-foam first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="mt-4 text-mute first:mt-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-2 pl-5 text-mute first:mt-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-2 pl-5 text-mute first:mt-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  a: ({ href, children }) => {
    const external = href?.startsWith('http')
    return (
      <a
        href={href}
        className="text-gold hover:underline"
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      >
        {children}
      </a>
    )
  },
  strong: ({ children }) => (
    <strong className="font-medium text-foam">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-4 border-l-2 border-gold/50 pl-4 text-mute first:mt-0">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    if (className) {
      return (
        <code className="block overflow-x-auto rounded-lg bg-panel-2 px-3 py-2 font-mono text-sm text-foam">
          {children}
        </code>
      )
    }
    return (
      <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-sm text-foam">
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="mt-4 overflow-x-auto first:mt-0">{children}</pre>
  ),
  hr: () => <hr className="my-8 border-line" />,
} satisfies Components

export function Markdown({ content }: { content: string }) {
  return <ReactMarkdown components={components}>{content}</ReactMarkdown>
}
