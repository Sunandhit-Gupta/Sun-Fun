export default function QuestionPanel({ question }) {
  if (!question) {
    return (
      <div className="col-span-2 bg-[#111827] rounded-xl p-8 text-center text-gray-400">
        Waiting for next question…
      </div>
    )
  }

  return (
    <div className="col-span-2 bg-[#111827] rounded-xl p-8">
      <h2 className="text-3xl font-bold mb-6">
        {question.text}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {question.options.map((opt) => (
          <div
            key={opt}
            className="bg-black/40 rounded-xl p-4 text-xl text-center"
          >
            {opt}
          </div>
        ))}
      </div>

      {question.correctAnswer && (
        <div className="mt-6 text-green-400 text-xl font-semibold text-center">
          ✅ Correct Answer: {question.correctAnswer}
        </div>
      )}
    </div>
  )
}
