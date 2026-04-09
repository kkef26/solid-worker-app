import Link from 'next/link'

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      {children}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex justify-around max-w-md mx-auto">
        <Link href="/manager/overview" className="flex flex-col items-center text-[#0B2265]">
          <span className="text-xl">👷</span>
          <span className="text-xs font-semibold">Επισκόπηση</span>
        </Link>
        <Link href="/manager/approvals" className="flex flex-col items-center text-gray-400">
          <span className="text-xl">✅</span>
          <span className="text-xs font-semibold">Εγκρίσεις</span>
        </Link>
        <Link href="/manager/assign" className="flex flex-col items-center text-gray-400">
          <span className="text-xl">📋</span>
          <span className="text-xs font-semibold">Ανάθεση</span>
        </Link>
      </div>
    </div>
  )
}
