import QuizSpectatorView from "../../app/watch/quiz/QuizSpectatorView"

export default function GameRenderer({ liveState }) {
  const { selectedGame, gameData } = liveState

  if (!selectedGame) {
    return (
      <div className="text-center text-gray-400 text-2xl mt-20">
        Waiting for a game to start…
      </div>
    )
  }

  switch (selectedGame) {
    case "quiz":
      return <QuizSpectatorView data={gameData} />

    default:
      return (
        <div className="text-center text-red-400 text-2xl">
          Unsupported game: {selectedGame}
        </div>
      )
  }
}
