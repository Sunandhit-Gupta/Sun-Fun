"use client"

import { getSocket } from "@/lib/socket"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

const MAX_PLAYERS = Number(process.env.NEXT_PUBLIC_MAX_PLAYERS || 10)


export default function LobbyPage() {
    const { code } = useParams()
    const socketRef = useRef(null)
    const router = useRouter()


    const [players, setPlayers] = useState([])
    const [phase, setPhase] = useState("lobby")
    const [selectedGame, setSelectedGame] = useState("quiz")
    const [mySocketId, setMySocketId] = useState(null)
    const [hostId, setHostId] = useState(null)


    useEffect(() => {
        const socket = getSocket()
        socketRef.current = socket

        let didJoin = false

        const name = localStorage.getItem("sunfun:name")
        if (!name) {
            router.push("/")
            return
        }

        const handleConnect = () => {
            // socket.id is now guaranteed
            setMySocketId(socket.id)

            if (didJoin) return
            didJoin = true

            socket.emit("join-room", {
                roomCode: code,
                name, // server will ignore if already known
            })

            socket.emit("get-room-state", {
                roomCode: code,
            })
        }

        // 🔌 Handle first connect & reconnects
        if (socket.connected) {
            handleConnect()
        } else {
            socket.on("connect", handleConnect)
        }

        socket.on("room-state", (data) => {
            setPlayers(data.players || [])
            setPhase(data.phase || "lobby")
            setSelectedGame(data.selectedGame || "quiz")
            setHostId(data.hostId || null)

            // ✅ Persist server-approved name once
            if (data.me?.name) {
                localStorage.setItem("sunfun:name", data.me.name)
            }
        })

        socket.on("room-update", (data) => {
            setPlayers(data.players || [])
            if (data.phase) setPhase(data.phase)
            if (data.hostId) setHostId(data.hostId)
        })

        socket.on("game-started", ({ game }) => {
            if (game === "quiz") {
                router.push(`/game/quiz/${code}`)
            }
        })

        socket.on("room-full", () => {
            alert("Room is full")
        })

        socket.on("room-locked", () => {
            alert("Game already started")
        })

        socket.on("name-required", () => {
            localStorage.removeItem("sunfun:name")
            router.push("/")
        })

        return () => {
            socket.off("connect", handleConnect)
            socket.off("room-state")
            socket.off("room-update")
            socket.off("game-started")
            socket.off("room-full")
            socket.off("room-locked")
            socket.off("name-required")
        }
    }, [code, router])


    if (!mySocketId) {
        return <div className="text-white">Connecting...</div>
    }

    const isHost = mySocketId === hostId

    return (
        <main className="min-h-screen px-6 py-10 bg-[#0B0F19] text-white flex justify-center">

            <div className="w-full max-w-4xl">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Lobby</h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Waiting for players to join
                        </p>
                    </div>

                    <div className="bg-[#111827] border border-white/10 rounded-xl px-6 py-4">
                        <p className="text-xs text-gray-400">Room Code</p>
                        <p className="text-xl font-mono tracking-widest text-yellow-400">
                            {code}
                        </p>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Players List */}
                    <div className="md:col-span-2 bg-[#111827] border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold mb-4">
                            Players ({players.length}/{MAX_PLAYERS})
                        </h2>

                        <div className="space-y-3">
                            {players.map((player) => (
                                <div
                                    key={player.id}
                                    className="flex items-center justify-between bg-[#0B0F19] rounded-xl px-4 py-3 border border-white/5"
                                >
                                    <span>{player.name}</span>

                                    {player.isHost && (
                                        <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                                            Host
                                        </span>
                                    )}
                                </div>
                            ))}

                            {players.length < 10 && (
                                <p className="text-sm text-gray-500 mt-4">
                                    Waiting for more players to join...
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Game Info / Controls */}
                    <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">

                        <div>
                            <h2 className="text-lg font-semibold mb-2">
                                Game Selection
                            </h2>

                            <p className="text-sm text-gray-400 mb-4">
                                After everyone joins, the host will choose a game.
                            </p>

                            <div className="bg-[#0B0F19] rounded-xl p-4 border border-white/5">
                                <p className="text-sm font-medium">
                                    🤖 AI Multiplayer Quiz
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    First available game
                                </p>
                            </div>
                        </div>

                        {/* Start Button */}
                        <button
                            onClick={() =>
                                socketRef.current?.emit("start-game", {
                                    roomCode: code, game: selectedGame,
                                })
                            }
                            disabled={!isHost || phase !== "lobby"}
                            className={`mt-6 w-full py-3 rounded-xl font-semibold transition
    ${isHost && phase === "lobby"
                                    ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:scale-[1.02]"
                                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                                }
  `}
                        >
                            Start Game
                        </button>


                        {!isHost && (
                            <p className="mt-3 text-xs text-gray-500 text-center">
                                Waiting for host to start the game
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
