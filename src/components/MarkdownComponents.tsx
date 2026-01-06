import React from 'react';
import MermaidDiagram from './MermaidDiagram';
import { cn } from '@/lib/utils';

interface MarkdownComponentsProps {
  basePath?: string;
}

export const createMarkdownComponents = ({ basePath }: MarkdownComponentsProps) => ({
  code({ inline, className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match && match[1] === 'mermaid') {
      return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
    }
    return (
      <code
        className={cn(
          inline ? "bg-slate-100 text-[#0c4a6e] px-1.5 py-0.5 rounded font-mono text-[0.9em] border border-slate-200 break-words" : "bg-transparent p-0 border-0 text-inherit",
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }: React.ComponentPropsWithoutRef<'pre'>) => (
    <pre className="mt-[0.2cm] mb-[0.8cm] relative bg-[#0f172a] text-[#f8fafc] p-[15px] rounded-lg text-[9pt] font-mono shadow-sm border border-white/5 leading-[1.45] whitespace-pre-wrap break-words overflow-hidden">
      {children}
    </pre>
  ),
  h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => {
    const id = children?.toString().toLowerCase().replace(/\s+/g, '-');
    return (
      <h2 id={id} className="text-[24pt] text-[#0369a1] font-sans font-bold mt-[0.8cm] mb-[0.3cm] border-l-[10px] border-[#0ea5e9] pl-[20px] py-[10px] bg-[#f8fafc] rounded-r-lg leading-[1.3]" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ children }: React.ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="text-[16pt] text-[#0369a1] font-sans font-bold mt-[0.6cm] mb-[0.2cm] flex items-center leading-[1.4]">
      <span className="w-[6px] h-[6px] bg-[#0ea5e9] rounded-full mr-[10px] inline-block shrink-0"></span>
      {children}
    </h3>
  ),
  p: ({ children }: React.ComponentPropsWithoutRef<'p'>) => {
    if (React.Children.count(children) === 1) {
      const firstChild = React.Children.toArray(children)[0];
      if (typeof firstChild === 'string' && firstChild.trim() === '\\pagebreak') {
        return <div className="page-break-marker" />;
      }
    }
    return (
      <p className="mb-[0.4cm] leading-[1.6] text-[#334155] text-justify text-[11pt] font-normal font-serif">
        {children}
      </p>
    );
  },
  ul: ({ children }: React.ComponentPropsWithoutRef<'ul'>) => (
    <ul className="list-disc mb-[0.4cm] pl-[1.5cm] text-[#334155] text-[11pt] font-serif leading-[1.6]">
      {children}
    </ul>
  ),
  ol: ({ children }: React.ComponentPropsWithoutRef<'ol'>) => (
    <ol className="list-decimal mb-[0.4cm] pl-[1.5cm] text-[#334155] text-[11pt] font-serif leading-[1.6]">
      {children}
    </ol>
  ),
  li: ({ children }: React.ComponentPropsWithoutRef<'li'>) => (
    <li className="mb-[0.2cm] pl-2">
      {children}
    </li>
  ),
  table: ({ children }: React.ComponentPropsWithoutRef<'table'>) => (
    <div className="mt-[0.2cm] mb-[0.6cm] w-full overflow-hidden">
      <table className="w-full border-collapse text-[10pt] font-sans">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: React.ComponentPropsWithoutRef<'th'>) => (
    <th className="bg-[#f8fafc] text-[#0369a1] font-bold uppercase tracking-[0.05em] text-[8.5pt] p-[10px] border-b-2 border-[#e2e8f0] text-left break-words">
      {children}
    </th>
  ),
  td: ({ children }: React.ComponentPropsWithoutRef<'td'>) => (
    <td className="p-[10px] border-b border-[#f1f5f9] text-[#475569] break-words">
      {children}
    </td>
  ),
  img: ({ src, alt }: React.ComponentPropsWithoutRef<'img'>) => {
    let imageSrc = typeof src === 'string' ? src : '';
    if (imageSrc.startsWith('./') && basePath) {
      const cleanBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
      imageSrc = cleanBasePath + imageSrc.slice(2);
    } else if (imageSrc && !imageSrc.startsWith('/') && !imageSrc.startsWith('http') && basePath) {
      const cleanBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
      imageSrc = cleanBasePath + imageSrc;
    }
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={imageSrc} alt={alt} className="max-w-full h-auto rounded-lg mx-auto mt-[0.2cm] mb-[0.8cm] block" />
    );
  },
  blockquote: ({ children }: React.ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-4">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-[0.8cm] border-slate-200" />,
});
