"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function WatchEntryPage() {
  const [code, setCode] = useState("")
  const router = useRouter()

  const watchRoom = () => {
    if (!code.trim()) return
    router.push(`/watch/${code.toUpperCase()}`)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-white px-6">
      <div className="bg-[#111827] p-8 rounded-2xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-6">🎥 Watch Live Game</h1>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter Room Code"
          className="w-full px-4 py-3 rounded-xl bg-black/30 mb-4 text-center uppercase"
        />

        <button
          onClick={watchRoom}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-semibold"
        >
          Watch Now
        </button>

        <p className="mt-4 text-sm text-gray-400">
          No login required · Spectator mode
        </p>
      </div>
    </main>
  )
}
