function getQuizLeaderboard(room) {
  return room.players
    .map(p => ({
      id: p.id,
      name: p.name,
      score: room.scores?.[p.id] || 0,
    }))
    .sort((a, b) => b.score - a.score)
}

module.exports = { getQuizLeaderboard }
