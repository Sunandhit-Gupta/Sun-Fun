const { rooms, socketRoomMap } = require("../rooms/roomStore")
const { createRoom } = require("../rooms/roomFactory")
const { emitLiveState, isPlayer } = require("../rooms/roomUtils")
const { stopRoomGame } = require("../rooms/roomStopGame")

const MAX_PLAYERS = Number(process.env.NEXT_PUBLIC_MAX_PLAYERS || 10)

module.exports = function setupRoomHandlers(io, socket) {

  // =========================
  // GET ROOM STATE
  // =========================
  socket.on("get-room-state", ({ roomCode }) => {
    const room = rooms.get(roomCode)
    if (!room) return

    const me = room.players.find(p => p.id === socket.id)

    socket.emit("room-state", {
      players: room.players,
      hostId: room.hostId,
      phase: room.phase,
      selectedGame: room.selectedGame,
      me, // 👈 IMPORTANT
    })
  })

  // =========================
  // JOIN AS SPECTATOR
  // =========================
  socket.on("join-as-spectator", ({ roomCode }) => {
    const room = rooms.get(roomCode)
    if (!room) return

    socket.join(roomCode)
    socketRoomMap.set(socket.id, roomCode)

    if (!room.spectators.includes(socket.id)) {
      room.spectators.push(socket.id)
    }

    emitLiveState(io, room)
  })

  // =========================
  // JOIN ROOM (PLAYER)
  // =========================
  socket.on("join-room", ({ roomCode, name }) => {
    if (!roomCode) return

    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, createRoom(roomCode))
    }

    const room = rooms.get(roomCode)
    socketRoomMap.set(socket.id, roomCode)

    const existing = room.players.find(p => p.id === socket.id)
    if (existing) {
      socket.join(roomCode)
      socket.emit("room-state", {
        players: room.players,
        hostId: room.hostId,
        phase: room.phase,
        selectedGame: room.selectedGame,
        me: existing,
      })
      return
    }

    if (!name) return socket.emit("name-required")
    if (room.phase !== "lobby") return socket.emit("room-locked")
    if (room.players.length >= MAX_PLAYERS) return socket.emit("room-full")

    const player = { id: socket.id, name, isHost: false }
    room.players.push(player)

    if (!room.hostId) {
      room.hostId = socket.id
      player.isHost = true
    }

    socket.join(roomCode)

    io.to(roomCode).emit("room-update", {
      players: room.players,
      hostId: room.hostId,
      phase: room.phase,
      selectedGame: room.selectedGame,
    })
  })

  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {
    const roomCode = socketRoomMap.get(socket.id)
    if (!roomCode) return

    const room = rooms.get(roomCode)
    socketRoomMap.delete(socket.id)
    if (!room) return

    // remove spectator
    room.spectators = room.spectators.filter(id => id !== socket.id)

    const index = room.players.findIndex(p => p.id === socket.id)

    // spectator only
    if (index === -1) {
      emitLiveState(io, room)
      return
    }

    const leftPlayer = room.players[index]
    room.players.splice(index, 1)

    console.log(`🔴 ${leftPlayer.name} left room ${roomCode}`)

    // host reassignment
    if (room.hostId === socket.id) {
      if (room.players.length > 0) {
        room.hostId = room.players[0].id
        room.players[0].isHost = true
      } else {
        stopRoomGame(room)
        rooms.delete(roomCode)
        console.log(`🧹 Room ${roomCode} deleted`)
        return
      }
    }

    emitLiveState(io, room)

    io.to(roomCode).emit("progress-update", {
      players: room.players,
      hostId: room.hostId,
      topicByPlayer: room.topicByPlayer || {},
      votes: room.votes || {},
      phase: room.phase,
    })
  })
}
