const { rooms } = require("../rooms/roomStore")
const { isPlayer } = require("../rooms/roomUtils")

module.exports = function setupLobbyHandlers(io, socket) {

  // =========================
  // START GAME (HOST)
  // =========================
  socket.on("start-game", ({ roomCode }) => {
    const room = rooms.get(roomCode)
    if (!room) return
    if (!isPlayer(room, socket.id)) return
    if (room.hostId !== socket.id) return

    room.phase = "topic_suggestion"
    room.selectedGame = "quiz"
    room.topics = {}
    room.topicByPlayer = {}
    room.votes = {}

    io.to(roomCode).emit("game-started", {
      game: "quiz",
      phase: room.phase,
    })

    io.to(roomCode).emit("progress-update", {
      players: room.players,
      hostId: room.hostId,
      topicByPlayer: room.topicByPlayer || {},
      votes: room.votes || {},
      phase: room.phase,
    })
  })

  // =========================
  // SUBMIT TOPIC
  // =========================
  socket.on("submit-topic", ({ roomCode, topic }) => {
    const room = rooms.get(roomCode)
    if (!room || room.phase !== "topic_suggestion") return
    if (!isPlayer(room, socket.id)) return
    if (room.topicByPlayer[socket.id]) return

    const clean = topic.trim()
    if (!clean) return

    room.topics[clean] = {
      votes: 0,
      createdBy: socket.id,
    }
    room.topicByPlayer[socket.id] = clean

    io.to(roomCode).emit("topics-updated", {
      topics: room.topics,
      phase: room.phase,
    })

    io.to(roomCode).emit("progress-update", {
      players: room.players,
      hostId: room.hostId,
      topicByPlayer: room.topicByPlayer || {},
      votes: room.votes || {},
      phase: room.phase,
    })

    if (Object.keys(room.topicByPlayer).length === room.players.length) {
      room.phase = "topic_voting"
      io.to(roomCode).emit("voting-started", {
        topics: room.topics,
      })

      io.to(roomCode).emit("progress-update", {
        players: room.players,
        hostId: room.hostId,
        topicByPlayer: room.topicByPlayer || {},
        votes: room.votes || {},
        phase: room.phase,
      })

    }
  })

  // =========================
  // VOTE TOPIC
  // =========================
  socket.on("vote-topic", ({ roomCode, topic }) => {
    const room = rooms.get(roomCode)
    if (!room || room.phase !== "topic_voting") return
    if (!isPlayer(room, socket.id)) return
    if (!room.topics[topic]) return

    if (room.votes[socket.id]) return
    if (room.topics[topic].createdBy === socket.id) {
      socket.emit("self-vote-not-allowed")
      return
    }

    room.votes[socket.id] = topic
    room.topics[topic].votes++

    io.to(roomCode).emit("topics-updated", {
      topics: room.topics,
      phase: room.phase,
    })

    if (Object.keys(room.votes).length === room.players.length) {
      let winner = null
      let maxVotes = -1

      for (const t in room.topics) {
        if (room.topics[t].votes > maxVotes) {
          maxVotes = room.topics[t].votes
          winner = t
        }
      }

      room.winningTopic = winner
      room.phase = "question_config"

      io.to(roomCode).emit("voting-ended", {
        winningTopic: winner,
      })

    }

    io.to(roomCode).emit("progress-update", {
      players: room.players,
      hostId: room.hostId,
      topicByPlayer: room.topicByPlayer || {},
      votes: room.votes || {},
      phase: room.phase,
    })

  })
}
