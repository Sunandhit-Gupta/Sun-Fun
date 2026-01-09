function createRoom(roomCode) {
  return {
    roomCode,
    players: [],
    spectators: [],
    hostId: null,
    phase: "lobby",
    selectedGame: null,
    gameState: {},

    activeGameId: null,
    questions: [],
    answers: {},
    scores: {},
    timer: null,
    currentQuestionIndex: 0,

    timerTimeout: null,
    advanceTimeout: null,
    returnTimeout: null,
  }
}

module.exports = { createRoom }
