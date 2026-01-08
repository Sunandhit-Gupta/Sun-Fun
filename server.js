require("dotenv").config()
const { generateQuizQuestions } = require("./src/lib/gemini")

const next = require("next")
const http = require("http")
const { Server } = require("socket.io")
const url = require("url")

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

const MAX_PLAYERS = Number(process.env.NEXT_PUBLIC_MAX_PLAYERS || 10)

// In-memory rooms
const rooms = new Map()

// =========================
// QUESTION TIMER HELPERS
// =========================

function startQuestionTimer(io, roomCode, room) {
    const DURATION = 60 // seconds

    // Clear old timer if exists
    if (room.timerTimeout) {
        clearTimeout(room.timerTimeout)
        room.timerTimeout = null
    }


    room.timer = {
        duration: DURATION,
        endsAt: Date.now() + DURATION * 1000,
    }

    room.questionStartedAt = Date.now()

    io.to(roomCode).emit("timer-started", {
        duration: DURATION,
        endsAt: room.timer.endsAt,
    })

    room.timerTimeout = setTimeout(() => {
        // If already moved on, skip
        if (room.phase !== "playing") return

        revealAndAdvance(io, roomCode, room)
    }, DURATION * 1000)
}

function revealAndAdvance(io, roomCode, room) {
    // Prevent double execution
    if (room.phase !== "playing") return

    room.phase = "revealing"

    const currentQ = room.questions[room.currentQuestionIndex]
    const correct = currentQ.correctAnswer

    // SCORE CALCULATION (with speed bonus)
    const BASE_SCORE = 10
    const MAX_BONUS = 60
    const QUESTION_TIME_MS = room.timer.duration * 1000

    for (const playerId in room.answers) {
        const { answer, answeredAt } = room.answers[playerId]

        if (answer !== correct) continue

        const timeTaken = answeredAt - room.questionStartedAt
        const remainingTime = Math.max(0, QUESTION_TIME_MS - timeTaken)

        const speedBonus = Math.floor(
            (remainingTime / QUESTION_TIME_MS) * MAX_BONUS
        )

        room.scores[playerId] += BASE_SCORE + speedBonus
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
        answers: room.answers, // 🔥 send who answered what
    })


    // Move to next question after 3s
    setTimeout(() => {
        room.currentQuestionIndex++
        room.answers = {}
        room.timer = null
        room.phase = "playing"

        if (room.currentQuestionIndex >= room.questions.length) {
            room.phase = "results"

            const RETURN_DELAY = 8000 // 8 seconds
            const returnToLobbyAt = Date.now() + RETURN_DELAY

            io.to(roomCode).emit("quiz-ended", {
                scores: room.scores, returnToLobbyAt,
            })
            setTimeout(() => {
                // 🧹 Reset game-related state
                room.phase = "lobby"
                room.selectedGame = null

                room.topics = {}
                room.topicByPlayer = {}
                room.votes = {}
                room.questions = []
                room.answers = {}
                room.timer = null
                room.currentQuestionIndex = 0
                room.scores = {}

                io.to(roomCode).emit("return-to-lobby", {
                    players: room.players,
                    hostId: room.hostId,
                }, RETURN_DELAY)

                console.log(`🔁 Room ${roomCode} returned to lobby`)
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

        // ⏱️ Start timer for next question
        startQuestionTimer(io, roomCode, room)

    }, 3000)
}

app.prepare().then(() => {
    const server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url, true)
        handle(req, res, parsedUrl)
    })

    const io = new Server(server, {
        cors: { origin: "*" },
    })

    io.on("connection", (socket) => {
        console.log("🟢 Socket connected:", socket.id)

        // ROOM STATE
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
        // JOIN ROOM
        // =========================
        socket.on("join-room", ({ roomCode, name }) => {
            if (!roomCode) return

            if (!rooms.has(roomCode)) {
                rooms.set(roomCode, {
                    players: [],
                    hostId: null,
                    phase: "lobby",
                    selectedGame: null,
                })
            }

            const room = rooms.get(roomCode)

            // 🔍 Check if this socket already exists
            const existingPlayer = room.players.find(
                (p) => p.id === socket.id
            )

            // ✅ CASE: Re-join with same socket (SPA navigation)
            if (existingPlayer) {
                socket.join(roomCode)

                socket.emit("room-state", {
                    players: room.players,
                    hostId: room.hostId,
                    phase: room.phase,
                    selectedGame: room.selectedGame,
                    me: existingPlayer,
                })

                return
            }

            // ❌ New socket → must have a name
            if (!name) {
                socket.emit("name-required")
                return
            }

            // ❌ Prevent late join
            if (room.phase !== "lobby") {
                socket.emit("room-locked")
                return
            }

            // ❌ Max players
            if (room.players.length >= MAX_PLAYERS) {
                socket.emit("room-full")
                return
            }

            // ✅ Create new player
            const player = {
                id: socket.id,
                name,
                isHost: false,
            }

            room.players.push(player)

            // 👑 Assign host if none exists
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
        // START GAME (HOST ONLY)
        // =========================
        socket.on("start-game", ({ roomCode, game }) => {
            const room = rooms.get(roomCode)
            if (!room) return
            if (socket.id !== room.hostId) return

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


        socket.on("submit-topic", ({ roomCode, topic }) => {
            const room = rooms.get(roomCode)
            if (!room || room.phase !== "topic_suggestion") return

            // Each player can suggest ONLY ONCE
            if (room.topicByPlayer[socket.id]) return

            const cleanTopic = topic.trim()
            if (!cleanTopic) return

            room.topics[cleanTopic] = {
                votes: 0,
                createdBy: socket.id,
            }

            room.topicByPlayer[socket.id] = cleanTopic

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


            // ✅ AUTO MOVE TO VOTING when all suggested
            if (
                Object.keys(room.topicByPlayer).length === room.players.length
            ) {
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



        socket.on("vote-topic", ({ roomCode, topic }) => {
            const room = rooms.get(roomCode)
            if (!room || room.phase !== "topic_voting") return
            if (!room.topics[topic]) return

            const topicData = room.topics[topic]

            // ❌ Prevent voting for own suggested topic
            if (topicData.createdBy === socket.id) {
                socket.emit("self-vote-not-allowed")
                return
            }

            // ❌ One vote per player
            if (room.votes[socket.id]) return

            room.votes[socket.id] = topic
            topicData.votes++

            io.to(roomCode).emit("topics-updated", {
                topics: room.topics,
                phase: room.phase,
            })



            // ✅ Auto-finish voting when all have voted
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

                io.to(roomCode).emit("progress-update", {
                    players: room.players,
                    hostId: room.hostId,
                    topicByPlayer: room.topicByPlayer || {},
                    votes: room.votes || {},
                    phase: room.phase,
                })


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


        socket.on("end-voting", ({ roomCode }) => {
            const room = rooms.get(roomCode)
            if (!room || socket.id !== room.hostId) return

            let winningTopic = null
            let maxVotes = -1

            for (const topic in room.topics) {
                if (room.topics[topic].votes > maxVotes) {
                    maxVotes = room.topics[topic].votes
                    winningTopic = topic
                }
            }

            room.winningTopic = winningTopic

            io.to(roomCode).emit("voting-ended", {
                topic: winningTopic,
            })

            console.log(`🏆 Winning topic: ${winningTopic}`)
        })

        socket.on("start-quiz", async ({ roomCode, questionCount }) => {
            const room = rooms.get(roomCode)
            if (!room) return
            if (socket.id !== room.hostId) return
            if (room.phase !== "question_config") return

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
                room.players.forEach(p => {
                    room.scores[p.id] = 0
                })

                io.to(roomCode).emit("quiz-started", {
                    questionIndex: 0,
                    total: questions.length,
                    question: {
                        text: questions[0].question,
                        options: questions[0].options,
                    },
                })

                // ⏱️ Start timer for first question
                startQuestionTimer(io, roomCode, room)

                io.to(roomCode).emit("progress-update", {
                    players: room.players,
                    hostId: room.hostId,
                    phase: room.phase,
                })

                console.log(`🧠 Quiz started in room ${roomCode}`)
            } catch (error) {
                console.error("🔥 Gemini Error:", error.message)

                socket.emit("quiz-error", {
                    message: "Failed to generate quiz questions. Please try again.",
                })
            }
        })

        socket.on("submit-answer", ({ roomCode, answer }) => {
            const room = rooms.get(roomCode)
            if (!room) return
            if (room.phase !== "playing") return

            // Prevent multiple answers
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

            // If all players answered → reveal answer
            // If ALL players answered BEFORE time ends
            if (Object.keys(room.answers).length === room.players.length) {

                // Stop the timer
                if (room.timerTimeout) {
                    clearTimeout(room.timerTimeout)
                    room.timerTimeout = null
                }

                revealAndAdvance(io, roomCode, room)
            }


        })




        // =========================
        // DISCONNECT
        // =========================
        socket.on("disconnect", () => {
            rooms.forEach((room, roomCode) => {
                const index = room.players.findIndex(
                    (p) => p.id === socket.id
                )

                if (index === -1) return

                const leftPlayer = room.players[index]
                room.players.splice(index, 1)

                // Reassign host
                if (room.hostId === socket.id) {
                    if (room.players.length > 0) {
                        room.hostId = room.players[0].id
                        room.players[0].isHost = true
                    } else {
                        rooms.delete(roomCode)
                        console.log(`🧹 Room ${roomCode} deleted`)
                        return
                    }
                }

                io.to(roomCode).emit("progress-update", {
                    players: room.players,
                    hostId: room.hostId,
                    topicByPlayer: room.topicByPlayer || {},
                    votes: room.votes || {},
                    phase: room.phase,
                })

                console.log(`🔴 ${leftPlayer.name} left room ${roomCode}`)
            })
        })
    })

    const PORT = process.env.PORT || 3000
    server.listen(PORT, () => {
        console.log(`🚀 Server running at ${process.env.NEXT_PUBLIC_BASE_URL}`)
    })
})
