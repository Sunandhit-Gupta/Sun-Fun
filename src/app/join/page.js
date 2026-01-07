"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
const MAX_PLAYERS = Number(process.env.NEXT_PUBLIC_MAX_PLAYERS || 10)

export default function JoinLobby() {
  const router = useRouter()

  const [roomCode, setRoomCode] = useState("")
  const [nickname, setNickname] = useState("")
  const [loading, setLoading] = useState(false)

  const handleJoinLobby = () => {
    if (!roomCode.trim() || !nickname.trim()) return

    setLoading(true)

    // storing nickname:
    localStorage.setItem("sunfun:name", nickname)

    setTimeout(() => {
      router.push(
        `/lobby/${roomCode.toUpperCase()}?name=${encodeURIComponent(
          nickname
        )}&host=false`
      )
    }, 500)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[#0B0F19] text-white relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/10 blur-[140px] rounded-full" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-xl">

        <h1 className="text-2xl font-bold mb-2 text-center">
          Join a Lobby 🎮
        </h1>

        <p className="text-gray-400 text-sm text-center mb-8">
          Enter the room code shared by the host.
        </p>

        {/* Room Code */}
        <div className="mb-5">
          <label className="block text-sm text-gray-300 mb-2">
            Room Code
          </label>
          <input
            type="text"
            placeholder="ABC123"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 rounded-xl bg-[#0B0F19] border border-white/10 focus:outline-none focus:border-yellow-400 tracking-widest transition"
          />
        </div>

        {/* Nickname */}
        <div className="mb-6">
          <label className="block text-sm text-gray-300 mb-2">
            Your Nickname
          </label>
          <input
            type="text"
            placeholder="e.g. Alex"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#0B0F19] border border-white/10 focus:outline-none focus:border-yellow-400 transition"
          />
        </div>

        {/* Button */}
        <button
          onClick={handleJoinLobby}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold transition-all duration-300
            ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/30"
            }
          `}
        >
          {loading ? "Joining..." : "Join Lobby"}
        </button>

        {/* Info */}
        <p className="mt-6 text-xs text-gray-500 text-center">
          Max {MAX_PLAYERS} players • Guest mode • No sign-up required
        </p>
      </div>
    </main>
  )
}
