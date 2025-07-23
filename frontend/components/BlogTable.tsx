import React from 'react'

export function BlogTable ({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto my-8 rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 bg-white text-left text-sm">
        {children}
      </table>
    </div>
  )
}

export function BlogThead ({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gray-50">{children}</thead>
}

export function BlogTbody ({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>
}

export function BlogTr ({ children }: { children: React.ReactNode }) {
  return <tr className="hover:bg-gray-50 transition">{children}</tr>
}

export function BlogTh ({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold text-gray-700 bg-gray-50">{children}</th>
}

export function BlogTd ({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-gray-700 align-top">{children}</td>
} 