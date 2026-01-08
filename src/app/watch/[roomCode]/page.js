"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getSocket } from "@/lib/socket"
import GameRenderer from "@/components/watch/GameRenderer"

export default function WatchRoomPage() {
  const { roomCode } = useParams()
  const [liveState, setLiveState] = useState(null)

  useEffect(() => {
    const socket = getSocket()

    socket.emit("join-as-spectator", { roomCode })

    socket.on("room-live-state", (state) => {
      setLiveState(state)
    })

    return () => {
      socket.off("room-live-state")
    }
  }, [roomCode])

  if (!liveState) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white text-2xl">
        Connecting to live room…
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <Header liveState={liveState} />
      <GameRenderer liveState={liveState} />
    </main>
  )
}

function Header({ liveState }) {
  return (
    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
      <div>
        <h1 className="text-3xl font-bold">🎮 Live Game</h1>
        <p className="text-gray-400">Room Code: {liveState.roomCode}</p>
      </div>

      <div className="text-right">
        <p className="text-sm text-gray-400">Spectators</p>
        <p className="text-xl font-semibold">
          👀 {liveState.spectatorsCount}
        </p>
      </div>
    </div>
  )
}
