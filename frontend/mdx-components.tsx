import type { MDXComponents } from 'mdx/types'
import React from 'react';

// Callout component for tips, warnings, etc.
export function Callout({ type = 'info', children }: { type?: 'info' | 'warning' | 'success', children: React.ReactNode }) {
  const color = type === 'info' ? 'blue' : type === 'warning' ? 'yellow' : 'green';
  return (
    <div className={`border-l-4 pl-4 py-2 my-4 bg-${color}-50 border-${color}-400 text-${color}-900 rounded`}> 
      <strong className={`block mb-1 text-${color}-700 capitalize`}>{type}</strong>
      <div>{children}</div>
    </div>
  );
}

export function HighlightedText({ children }: { children: React.ReactNode }) {
  return <span className="bg-yellow-200 px-1 rounded text-black font-semibold">{children}</span>;
}

export function CustomH1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-10 mb-6 leading-tight">{children}</h1>;
}
export function CustomH2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-3xl font-bold text-blue-700 mt-10 mb-4">{children}</h2>;
}
export function CustomH3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">{children}</h3>;
}
export function CustomP({ children }: { children: React.ReactNode }) {
  return <p className="text-lg text-gray-700 leading-relaxed mb-5">{children}</p>;
}
export function CustomUL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-6 mb-5 space-y-2 text-gray-700">{children}</ul>;
}
export function CustomOL({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal pl-6 mb-5 space-y-2 text-gray-700">{children}</ol>;
}
export function CustomLI({ children }: { children: React.ReactNode }) {
  return <li className="ml-2">{children}</li>;
}
export function CustomBlockquote({ children }: { children: React.ReactNode }) {
  return <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-600 my-6">{children}</blockquote>;
}
export function CustomCode({ children }: { children: React.ReactNode }) {
  return <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-base font-mono">{children}</code>;
}
// Custom table components
export function CustomTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto my-8 rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 bg-white text-left text-sm">
        {children}
      </table>
    </div>
  )
}

export function CustomThead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-gray-50">
      {children}
    </thead>
  )
}

export function CustomTbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>
}

export function CustomTr({ children }: { children: React.ReactNode }) {
  return <tr className="hover:bg-gray-50 transition">{children}</tr>
}

export function CustomTh({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-semibold text-gray-700 bg-gray-50">
      {children}
    </th>
  )
}

export function CustomTd({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3 text-gray-700 align-top">
      {children}
    </td>
  )
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h1: CustomH1,
    h2: CustomH2,
    h3: CustomH3,
    p: CustomP,
    ul: CustomUL,
    ol: CustomOL,
    li: CustomLI,
    blockquote: CustomBlockquote,
    code: CustomCode,
    table: CustomTable,
    thead: CustomThead,
    tbody: CustomTbody,
    tr: CustomTr,
    th: CustomTh,
    td: CustomTd,
    Callout,
    HighlightedText,
  }
}

const components: MDXComponents = {
  h1: CustomH1,
  h2: CustomH2,
  h3: CustomH3,
  p: CustomP,
  ul: CustomUL,
  ol: CustomOL,
  li: CustomLI,
  blockquote: CustomBlockquote,
  code: CustomCode,
  table: CustomTable,
  thead: CustomThead,
  tbody: CustomTbody,
  tr: CustomTr,
  th: CustomTh,
  td: CustomTd,
  Callout,
  HighlightedText,
};
export default components;