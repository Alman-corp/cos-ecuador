import Link from "next/link"

export const metadata = { title: "COS Due Diligence" }

export default function DueDiligenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/due-diligence" className="font-bold text-gray-900 text-lg">COS Due Diligence</Link>
          <div className="flex gap-4 text-sm">
            <Link href="/due-diligence" className="text-gray-500 hover:text-blue-600">Nuevo</Link>
            <Link href="/due-diligence/history" className="text-gray-500 hover:text-blue-600">Historial</Link>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
