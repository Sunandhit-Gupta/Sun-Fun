function startQuestionTimer({ io, room, roomCode, gameId, onExpire }) {
    if (room.activeGameId !== gameId) return

    const DURATION = 60

    clearTimeout(room.timerTimeout)

    room.questionStartedAt = Date.now()
    room.timer = {
        duration: DURATION,
        endsAt: room.questionStartedAt + DURATION * 1000,
    }

    io.to(roomCode).emit("timer-started", {
        duration: DURATION,
        endsAt: room.timer.endsAt,
    })

    room.timerTimeout = setTimeout(() => {
        if (room.activeGameId !== gameId) return
        if (room.phase !== "playing") return
        onExpire()
    }, DURATION * 1000)
}


module.exports = { startQuestionTimer }
