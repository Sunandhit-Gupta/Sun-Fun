function isPlayer(room, socketId) {
  return room.players.some(p => p.id === socketId)
}

function emitLiveState(io, room) {
  const gameData =
    room.selectedGame && room.activeGameId
      ? room.gameState[room.selectedGame] || null
      : null

  io.to(room.roomCode).emit("room-live-state", {
    roomCode: room.roomCode,
    phase: room.phase,
    selectedGame: room.selectedGame,
    players: room.players.map(p => ({ id: p.id, name: p.name })),
    spectatorsCount: room.spectators.length,
    gameData,
  })
}

module.exports = { isPlayer, emitLiveState }
