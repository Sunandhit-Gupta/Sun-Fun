const { randomUUID } = require("crypto")
const { rooms } = require("../rooms/roomStore")
const { isPlayer, emitLiveState } = require("../rooms/roomUtils")
const { generateQuizQuestions } = require("../../src/lib/gemini")
const { revealAndAdvance } = require("../games/quiz/quiz.engine")
const { startQuestionTimer } = require("../games/quiz/quiz.timer")
const { getQuizLeaderboard } = require("../games/quiz/quiz.utils")

module.exports = function setupQuizHandlers(io, socket) {

  // =========================
  // START QUIZ
  // =========================
  socket.on("start-quiz", async ({ roomCode, questionCount }) => {
    const room = rooms.get(roomCode)
    if (!room) return
    if (!isPlayer(room, socket.id)) return
    if (room.hostId !== socket.id) return
    if (room.phase !== "question_config") return
    if (room.activeGameId) return

    const gameId = randomUUID()
    room.activeGameId = gameId
    room.phase = "playing"
    room.currentQuestionIndex = 0
    room.answers = {}

    try {
      const questions = await generateQuizQuestions(
        room.winningTopic,
        questionCount
      )

      room.questions = questions
      room.scores = {}
      room.players.forEach(p => (room.scores[p.id] = 0))

      io.to(roomCode).emit("quiz-started", {
        questionIndex: 0,
        total: questions.length,
        question: {
          text: questions[0].question,
          options: questions[0].options,
        },
      })

      startQuestionTimer({
        io,
        room,
        roomCode,
        gameId,
        onExpire: () =>
          revealAndAdvance({ io, room, roomCode, gameId }),
      })

      io.to(roomCode).emit("progress-update", {
        players: room.players,
        hostId: room.hostId,
        phase: room.phase,
      })

      room.gameState.quiz = {
        gameId,
        question: {
          text: questions[0].question,
          options: questions[0].options,
        },
        leaderboard: getQuizLeaderboard(room),
      }

      emitLiveState(io, room)

    } catch (err) {
      socket.emit("quiz-error", {
        message: "Failed to generate quiz questions",
      })
    }
  })

  // =========================
  // SUBMIT ANSWER
  // =========================
  socket.on("submit-answer", ({ roomCode, answer }) => {
    const room = rooms.get(roomCode)
    if (!room) return
    if (!isPlayer(room, socket.id)) return
    if (room.phase !== "playing") return
    if (room.answers[socket.id]) return

    room.answers[socket.id] = {
      answer,
      answeredAt: Date.now(),
    }

    // Notify players about progress
    io.to(roomCode).emit("answer-progress", {
      answeredCount: Object.keys(room.answers).length,
      totalPlayers: room.players.length,
    })

    if (Object.keys(room.answers).length === room.players.length) {
      clearTimeout(room.timerTimeout)
      revealAndAdvance({
        io,
        room,
        roomCode,
        gameId: room.activeGameId,
      })
    }
  })
}
