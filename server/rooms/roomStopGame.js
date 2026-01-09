
function stopRoomGame(room) {
    // 🔐 Invalidate running game
    room.activeGameId = null

    // ⏱️ Clear all timers safely
    if (room.timerTimeout) {
        clearTimeout(room.timerTimeout)
        room.timerTimeout = null
    }

    if (room.advanceTimeout) {
        clearTimeout(room.advanceTimeout)
        room.advanceTimeout = null
    }

    if (room.returnTimeout) {
        clearTimeout(room.returnTimeout)
        room.returnTimeout = null
    }

    // 🧹 Reset game-related state
    room.phase = "lobby"
    room.selectedGame = null
    room.gameState = {}

    room.questions = []
    room.answers = {}
    room.timer = null
    room.questionStartedAt = null
    room.currentQuestionIndex = 0
    room.scores = {}

    // 🧠 Lobby state reset (safe defaults)
    room.topics = {}
    room.topicByPlayer = {}
    room.votes = {}
    room.winningTopic = null
}

module.exports = {
    stopRoomGame,
}
