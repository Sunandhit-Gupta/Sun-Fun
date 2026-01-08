export default function Leaderboard({ leaderboard = [], rankDelta = {} }) {
    if (!leaderboard.length) {
        return (
            <div className="bg-[#111827] rounded-xl p-6 text-center text-gray-400">
                Waiting for scores…
            </div>
        )
    }

    return (
        <div className="bg-[#111827] rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Leaderboard</h3>

            <div className="space-y-3 text-sm">
                {leaderboard.map((p, index) => {
                    const delta = rankDelta[p.id]

                    return (
                        <div key={p.id} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400">{index + 1}.</span>
                                <span>{p.name}</span>

                                {delta === "up" && <span className="text-green-400">↑</span>}
                                {delta === "down" && <span className="text-red-400">⬇</span>}
                                {delta === "same" && <span className="text-gray-500">➖</span>}
                                {delta === "new" && <span className="text-blue-400">👶🏻</span>}
                            </div>

                            <span className="text-yellow-400 font-semibold">
                                {p.score}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
