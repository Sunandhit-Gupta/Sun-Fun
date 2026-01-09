const { getQuizLeaderboard } = require("./quiz.utils")
const { startQuestionTimer } = require("./quiz.timer")
const { emitLiveState } = require("../../rooms/roomUtils")
const { resetRoom } = require("../../rooms/roomFactory")
const { stopRoomGame } = require("../../rooms/roomStopGame")

function revealAndAdvance({ io, room, roomCode, gameId }) {
    if (room.activeGameId !== gameId) return
    if (room.phase !== "playing") return
    if (!room.timer) return

    room.phase = "revealing"

    const currentQ = room.questions[room.currentQuestionIndex]
    const correct = currentQ.correctAnswer

    const BASE = 10
    const BONUS = 60
    const TOTAL = room.timer.duration * 1000

    for (const pid in room.answers) {
        const { answer, answeredAt } = room.answers[pid]
        if (answer !== correct) continue

        const taken = answeredAt - room.questionStartedAt
        const remaining = Math.max(0, TOTAL - taken)
        room.scores[pid] += (BASE + Math.floor((remaining / TOTAL) * BONUS))
    }

    const stats = {}
    currentQ.options.forEach(opt => stats[opt] = 0)

    for (const pid in room.answers) {
        stats[room.answers[pid].answer]++
    }

    io.to(roomCode).emit("reveal-answer", {
        correctAnswer: correct,
        scores: room.scores,
        stats,
        answers: room.answers,
    })

    room.gameState.quiz = {
        gameId,
        question: {
            text: currentQ.question,
            options: currentQ.options,
            correctAnswer: correct,
        },
        leaderboard: getQuizLeaderboard(room),
        stats,
    }

    emitLiveState(io, room)

    room.advanceTimeout = setTimeout(() => {

        if (room.activeGameId !== gameId) return

        room.currentQuestionIndex++
        room.answers = {}
        room.timer = null
        room.phase = "playing"

        if (room.currentQuestionIndex >= room.questions.length) {
            room.phase = "results"

            const RETURN_DELAY = 8000 // 8 seconds
            const returnToLobbyAt = Date.now() + RETURN_DELAY

            io.to(roomCode).emit("quiz-ended", { scores: room.scores, returnToLobbyAt })

            room.gameState.quiz = {
                gameId,
                leaderboard: getQuizLeaderboard(room),
                finished: true,
            }

            emitLiveState(io, room)

            room.returnTimeout = setTimeout(() => {
                stopRoomGame(room)
                io.to(roomCode).emit("return-to-lobby", {
                    players: room.players,
                    hostId: room.hostId,
                }, RETURN_DELAY)
                emitLiveState(io, room)
            }, 8000)

            return
        }

        const nextQ = room.questions[room.currentQuestionIndex]

        io.to(roomCode).emit("next-question", {
            questionIndex: room.currentQuestionIndex,
            question: {
                text: nextQ.question,
                options: nextQ.options,
            },
        })

        room.gameState.quiz = {
            gameId,
            question: {
                text: nextQ.question,
                options: nextQ.options,
            },
            leaderboard: getQuizLeaderboard(room),
        }
        emitLiveState(io, room)

        startQuestionTimer({
            io,
            room,
            roomCode,
            gameId,
            onExpire: () =>
                revealAndAdvance({ io, room, roomCode, gameId }),
        })
    }, 3000)
}

module.exports = { revealAndAdvance }
