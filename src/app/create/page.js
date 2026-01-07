"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
const MAX_PLAYERS = Number(process.env.NEXT_PUBLIC_MAX_PLAYERS || 10)

export default function CreateLobby() {
  const router = useRouter()
  const [nickname, setNickname] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreateLobby = () => {
    if (!nickname.trim()) return

    setLoading(true)

    // Generate simple 6-letter room code
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // storing nickname :
    localStorage.setItem("sunfun:name", nickname)

    // Later we will replace this with socket logic
    setTimeout(() => {
      router.push(`/lobby/${roomCode}?name=${encodeURIComponent(nickname)}&host=true`)
    }, 600)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[#0B0F19] text-white relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-yellow-500/10 blur-[140px] rounded-full" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-xl">

        <h1 className="text-2xl font-bold mb-2 text-center">
          Create a Lobby 🚀
        </h1>

        <p className="text-gray-400 text-sm text-center mb-8">
          You’ll be the host. Invite friends and choose a game.
        </p>

        {/* Nickname Input */}
        <div className="mb-6">
          <label className="block text-sm text-gray-300 mb-2">
            Your Nickname
          </label>
          <input
            type="text"
            placeholder="e.g. Sunandhit"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#0B0F19] border border-white/10 focus:outline-none focus:border-yellow-400 transition"
          />
        </div>

        {/* Button */}
        <button
          onClick={handleCreateLobby}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold transition-all duration-300
            ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/30"
            }
          `}
        >
          {loading ? "Creating Lobby..." : "Create Lobby"}
        </button>

        {/* Info */}
        <p className="mt-6 text-xs text-gray-500 text-center">
          Max {MAX_PLAYERS} players • Guest mode • No sign-up required
        </p>
      </div>
    </main>
  )
}
