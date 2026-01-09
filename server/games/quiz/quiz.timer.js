function startQuestionTimer({ io, room, roomCode, gameId, onExpire }) {
  if (room.activeGameId !== gameId) return

  const DURATION = 60
  clearTimeout(room.timerTimeout)

  room.timer = {
    duration: DURATION,
    endsAt: Date.now() + DURATION * 1000,
  }

  io.to(roomCode).emit("timer-started", room.timer)

  room.timerTimeout = setTimeout(() => {
    if (room.activeGameId !== gameId) return
    onExpire()
  }, DURATION * 1000)
}

module.exports = { startQuestionTimer }
