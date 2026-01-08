export default function StatsPanel({ stats, finished }) {
  if (finished) {
    return (
      <div className="bg-[#111827] rounded-xl p-6 text-center text-2xl text-green-400">
        🎉 Quiz Finished!
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-[#111827] rounded-xl p-6 text-center text-gray-400">
        Waiting for answers…
      </div>
    )
  }

  return (
    <div className="bg-[#111827] rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-3">📊 Answer Stats</h3>

      {Object.entries(stats).map(([opt, count]) => (
        <div key={opt} className="flex justify-between text-sm mb-2">
          <span>{opt}</span>
          <span>{count}</span>
        </div>
      ))}
    </div>
  )
}
