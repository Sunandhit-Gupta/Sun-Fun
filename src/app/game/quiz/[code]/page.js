"use client"

import CircularTimer from "@/components/CircularTimer"
import { fireConfetti } from "@/lib/confetti"
import { fireSideConfetti } from "@/lib/confetti"
import { getSocket } from "@/lib/socket"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const playSound = (src, volume = 0.6) => {
  const audio = new Audio(src)
  audio.volume = volume
  audio.play().catch(() => { })
}


function PlayerStatusPanel({ players, phase, topicByPlayer, votes }) {
  return (
    <div className="bg-[#111827] border border-white/10 rounded-xl p-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">
        Player Status
      </h3>

      <div className="space-y-2">
        {players.map((player) => {
          const done =
            phase === "topic_suggestion"
              ? Boolean(topicByPlayer[player.id])
              : phase === "topic_voting"
                ? Boolean(votes[player.id])
                : true

          return (
            <div
              key={player.id}
              className="flex items-center justify-between text-sm"
            >
              <span>{player.name}</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium
                  ${done
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                  }
                `}
              >
                {done ? "Done" : "Pending"}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}


export default function QuizGamePage() {
  const { code } = useParams()
  const socketRef = useRef(null)
  const timerRef = useRef(null)
  const lastTickRef = useRef(null)

  const [phase, setPhase] = useState("topic_suggestion")
  const [topicInput, setTopicInput] = useState("")
  const [topics, setTopics] = useState({})
  const [winningTopic, setWinningTopic] = useState(null)
  const [questionCount, setQuestionCount] = useState(5)

  const [players, setPlayers] = useState([])
  const [topicByPlayer, setTopicByPlayer] = useState({})
  const [votes, setVotes] = useState({})
  const [hostId, setHostId] = useState(null)
  const [mySocketId, setMySocketId] = useState(null)
  const [question, setQuestion] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [correctAnswer, setCorrectAnswer] = useState(null)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [scores, setScores] = useState({})
  const [timeLeft, setTimeLeft] = useState(60)
  const [allAnswered, setAllAnswered] = useState(false)
  const [answerStats, setAnswerStats] = useState(null)
  const [returnCountdown, setReturnCountdown] = useState(null)
  const returnTimerRef = useRef(null)
  const [startingQuiz, setStartingQuiz] = useState(false)





  useEffect(() => {
    const socket = getSocket()
    socketRef.current = socket
    setMySocketId(socket.id)

    socket.on("topics-updated", ({ topics, phase }) => {
      setTopics({ ...topics })
      if (phase) setPhase(phase)
    })

    socket.on("voting-started", () => {
      setPhase("topic_voting")
    })

    socket.on("voting-ended", ({ winningTopic }) => {
      setWinningTopic(winningTopic)
      setPhase("question_config")
    })

    socket.on("self-vote-not-allowed", () => {
      alert("You cannot vote for your own topic")
    })

    socket.on("quiz-started", (data) => {
      setStartingQuiz(false) // 🔥 STOP LOADER
      setPhase("playing")
      setQuestion(data.question)
      setCurrentIndex(data.questionIndex)
      setTotalQuestions(data.total)
      // ✅ RESET STATE FOR CLEAN START
      setTopicByPlayer({})
      setVotes({})
    })

    socket.on("progress-update", (data) => {
      setPlayers(data.players || [])
      setTopicByPlayer(data.topicByPlayer || {})
      setVotes(data.votes || {})
      setHostId(data.hostId)
      if (data.phase) setPhase(data.phase)
    })

    socket.on("answer-progress", ({ answeredCount, totalPlayers }) => {
      setAnsweredCount(answeredCount)
      if (answeredCount === totalPlayers) {
        setAllAnswered(true)
      }
    })


    socket.on("reveal-answer", ({ correctAnswer, scores, stats, answers }) => {
      setCorrectAnswer(correctAnswer)
      setScores(scores)
      setAnswerStats(stats)

      const socketId = socketRef.current?.id
      const myAnswer = answers?.[socketId]

      console.log("Socket ID:", socketId)
      console.log("Answers map:", answers)
      console.log("My Answer:", myAnswer)
      console.log("Correct:", correctAnswer)

      if (!myAnswer) return

      if (myAnswer === correctAnswer) {
        playSound("/sounds/correct.mp3", 0.6)
        fireConfetti() // 🎉 BOOM
      } else {
        playSound("/sounds/wrong.mp3", 0.6)
      }
    })



    socket.on("next-question", (data) => {

      // 🔥 STOP OLD TIMER
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setQuestion(data.question)
      setCurrentIndex(data.questionIndex)

      // reset per-question state
      setSelectedAnswer(null)
      setCorrectAnswer(null)
      setAnsweredCount(0)
      setAllAnswered(false)
      setAnswerStats(null)
      lastTickRef.current = null

    })

    socket.on("timer-started", ({ duration, endsAt }) => {
      // 🔥 CLEAR OLD INTERVAL FIRST
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      const tick = () => {
        const remaining = Math.max(
          0,
          Math.ceil((endsAt - Date.now()) / 1000)
        )
        setTimeLeft(remaining)

        if (remaining <= 0) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }

        if (
          remaining <= 5 &&
          remaining > 0 &&
          lastTickRef.current !== remaining
        ) {
          playSound("/sounds/tick.mp3", 0.3)
          lastTickRef.current = remaining
        }


      }

      tick() // immediate update
      timerRef.current = setInterval(tick, 250)
    })



    socket.on("quiz-ended", ({ scores, returnToLobbyAt }) => {

      playSound("/sounds/finish.mp3", 0.7)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setScores(scores)
      setPhase("results")

      // 🎉 Winner celebration
      setTimeout(() => {
        fireSideConfetti()
      }, 300)

      // 🔢 start countdown
      const tick = () => {
        const remaining = Math.max(
          0,
          Math.ceil((returnToLobbyAt - Date.now()) / 1000)
        )
        setReturnCountdown(remaining)

        if (remaining <= 0) {
          clearInterval(returnTimerRef.current)
          returnTimerRef.current = null
        }
      }

      tick()
      returnTimerRef.current = setInterval(tick, 250)

    })

    socket.on("return-to-lobby", ({ players, hostId }) => {

      if (returnTimerRef.current) {
        clearInterval(returnTimerRef.current)
      }
      // optional: fade-out animation delay
      setTimeout(() => {
        window.location.href = `/lobby/${code}`
      }, 500)
    })



    return () => {

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      socket.off("topics-updated")
      socket.off("voting-started")
      socket.off("voting-ended")
      socket.off("self-vote-not-allowed")
      socket.off("answer-progress")
      socket.off("reveal-answer")
      socket.off("next-question")
      socket.off("timer-started")
      socket.off("quiz-ended")
      lastTickRef.current = null

    }
  }, [])

  const submitTopic = () => {
    if (!topicInput.trim()) return

    socketRef.current.emit("submit-topic", {
      roomCode: code,
      topic: topicInput.trim(),
    })

    setTopicInput("")
  }

  const voteTopic = (topic) => {
    socketRef.current.emit("vote-topic", {
      roomCode: code,
      topic,
    })
  }

  const startQuiz = () => {
    if (startingQuiz) return

    setStartingQuiz(true)

    socketRef.current.emit("start-quiz", {
      roomCode: code,
      questionCount,
    })
  }


  const selectOption = (option) => {
    if (selectedAnswer) return // lock answer

    setSelectedAnswer(option)

    socketRef.current.emit("submit-answer", {
      roomCode: code,
      answer: option,
    })
  }


  /* =============================
     PHASE 1: TOPIC SUGGESTION
     ============================= */
  if (phase === "topic_suggestion") {
    return (
      <main className="min-h-screen bg-[#0B0F19] text-white px-6 py-10">
        <div className="max-w-3xl mx-auto animate-fadeIn">
          <h1 className="text-3xl font-bold text-center mb-2">
            💡 Suggest a Quiz Topic
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Each player can suggest only one topic
          </p>

          <PlayerStatusPanel
            players={players}
            phase={phase}
            topicByPlayer={topicByPlayer}
            votes={votes}
          />

          <div className="flex gap-3 mb-8">

            <input
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g. Artificial Intelligence"
              className="flex-1 px-4 py-3 rounded-xl bg-[#111827] border border-white/10"
            />
            <button
              onClick={submitTopic}
              className="px-6 py-3 rounded-xl bg-yellow-400 text-black font-semibold"
            >
              Submit
            </button>
          </div>

          <p className="text-center text-gray-500">
            Waiting for all players to suggest a topic…
          </p>
        </div>
      </main>
    )
  }

  /* =============================
     PHASE 2: TOPIC VOTING
     ============================= */
  if (phase === "topic_voting") {
    return (
      <main className="min-h-screen bg-[#0B0F19] text-white px-6 py-10">
        <div className="max-w-3xl mx-auto animate-slideUp">
          <h1 className="text-3xl font-bold text-center mb-2">
            🗳️ Vote for a Topic
          </h1>
          <p className="text-gray-400 text-center mb-8">
            You cannot vote for your own topic
          </p>

          <PlayerStatusPanel
            players={players}
            phase={phase}
            topicByPlayer={topicByPlayer}
            votes={votes}
          />
          <div className="space-y-3">

            {Object.entries(topics).map(([topic, data]) => (
              <div
                key={topic}
                className="flex justify-between items-center bg-[#111827] rounded-xl px-4 py-3"
              >
                <span>{topic}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">
                    {data.votes} votes
                  </span>
                  <button
                    onClick={() => voteTopic(topic)}
                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
                  >
                    Vote
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-gray-500">
            Waiting for all players to vote…
          </p>
        </div>
      </main>
    )
  }

  /* =============================
     PHASE 3: QUESTION CONFIG (HOST)
     ============================= */
  if (phase === "question_config") {
    const isHost = mySocketId === hostId

    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-white px-6">
        <div className="bg-[#111827] p-8 rounded-2xl w-full max-w-md animate-scaleIn">

          <h1 className="text-2xl font-bold text-center mb-4">
            🏆 Topic Selected
          </h1>

          <p className="text-center text-yellow-400 font-semibold mb-6">
            {winningTopic}
          </p>

          {isHost ? (
            <>
              <label className="block text-sm text-gray-400 mb-2">
                Number of Questions
              </label>

              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-[#0B0F19] border border-white/10 mb-6"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
              </select>

              <button
                onClick={startQuiz}
                disabled={startingQuiz}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2
    ${startingQuiz
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-yellow-400 to-orange-500 text-black"
                  }
  `}
              >
                {startingQuiz ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Start Quiz 🚀"
                )}
              </button>

            </>
          ) : (
            <div className="text-center text-gray-400">
              <p className="mb-2">⏳ Host is selecting the number of questions</p>
              <p className="text-sm">Please wait…</p>
            </div>
          )}
        </div>
      </main>
    )
  }

  // Playing Phase
  if (phase === "playing" && question) {
    return (
      <main className="min-h-screen bg-[#0B0F19] text-white px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">
              Question {currentIndex + 1} / {totalQuestions}
            </p>

            <CircularTimer timeLeft={timeLeft} duration={60} />
          </div>


          <h1 className="text-2xl font-bold mb-6">
            {question.text}
          </h1>

          {allAnswered && (
            <div className="mb-4 text-center animate-bounce">
              <span className="inline-block px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
                ✅ All players answered!
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((opt) => {
              const isSelected = selectedAnswer === opt
              const isCorrect = correctAnswer === opt
              const isWrong =
                correctAnswer && isSelected && opt !== correctAnswer

              return (
                <button
                  key={opt}
                  onClick={() => selectOption(opt)}
                  disabled={!!selectedAnswer}
                  className={`px-4 py-3 rounded-xl transition font-medium
          ${correctAnswer
                      ? isCorrect
                        ? "bg-green-500 text-black"
                        : isWrong
                          ? "bg-red-500 text-black"
                          : "bg-[#111827]"
                      : isSelected
                        ? "bg-yellow-400 text-black"
                        : "bg-[#111827] hover:bg-white/10"
                    }
        `}
                >
                  {opt}
                </button>
              )
            })}
          </div>

          {answerStats && (
            <div className="mt-6 space-y-2">
              {Object.entries(answerStats).map(([opt, count]) => (
                <div key={opt} className="flex justify-between text-sm text-gray-400">
                  <span>{opt}</span>
                  <span>{count} players</span>
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 text-center text-gray-400">
            {answeredCount}/{players.length} answered
          </p>

          <div className="mt-6 bg-[#111827] rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Scores</h3>
            <div className="space-y-1 text-sm">
              {players.map(p => (
                <div key={p.id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-yellow-400">
                    {scores[p.id] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>


        </div>
      </main>
    )
  }

  // Results Phase
  if (phase === "results") {
    const sorted = [...players].sort(
      (a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)
    )

    const podium = [sorted[1], sorted[0], sorted[2]] // 2nd, 1st, 3rd

    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-white px-6">
        <div className="w-full max-w-2xl text-center">

          <h1 className="text-3xl font-bold mb-10">
            🏆 Final Results
          </h1>

          {/* Podium */}
          <div className="flex items-end justify-center gap-6 h-64 mb-10">
            {podium.map((player, idx) => {
              if (!player) return <div key={idx} className="w-24" />

              const height =
                idx === 1 ? "h-48" : idx === 0 ? "h-36" : "h-28"

              const medal =
                idx === 1 ? "🥇" : idx === 0 ? "🥈" : "🥉"

              return (
                <div
                  key={player.id}
                  className={`w-24 ${height} bg-[#111827] rounded-xl flex flex-col justify-end items-center animate-slideUp`}
                >
                  <div className="mb-2 text-2xl">{medal}</div>
                  <div className="text-sm font-semibold">{player.name}</div>
                  <div className="text-yellow-400 text-sm mb-2">
                    {scores[player.id] || 0}
                  </div>
                </div>
              )
            })}
          </div>

          {returnCountdown !== null && (
            <p className="mt-6 text-center text-gray-400 animate-pulse">
              Returning to lobby in{" "}
              <span className="text-yellow-400 font-semibold">
                {returnCountdown}
              </span>
              …
            </p>
          )}

          {/* Full leaderboard */}
          <div className="bg-[#111827] rounded-xl p-6 text-left">
            {sorted.map((p, i) => (
              <div
                key={p.id}
                className="flex justify-between py-2 text-sm"
              >
                <span>
                  {i + 1}. {p.name}
                </span>
                <span className="text-yellow-400">
                  {scores[p.id] || 0}
                </span>
              </div>
            ))}
          </div>

        </div>
      </main>
    )
  }

  return null
}
