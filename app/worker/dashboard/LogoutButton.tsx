'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/login', { method: 'DELETE' })
    router.push('/worker/login')
  }

  return (
    <button onClick={logout} className="text-white/60 text-sm hover:text-white">
      Έξοδος
    </button>
  )
}
