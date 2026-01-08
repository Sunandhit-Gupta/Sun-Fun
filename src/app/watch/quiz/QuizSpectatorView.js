"use client"

import CircularTimer from "@/components/CircularTimer"
import { useEffect, useRef, useState } from "react"

import Leaderboard from "./LeaderBoard"
import QuestionPanel from "./QuestionPanel"
import StatsPanel from "./StatsPanel"

function getScoreMap(leaderboard) {
    const map = {}
    leaderboard.forEach(p => {
        map[p.id] = p.score
    })
    return map
}

function scoresChanged(prev, next) {
    const prevKeys = Object.keys(prev)
    const nextKeys = Object.keys(next)

    if (prevKeys.length !== nextKeys.length) return true

    for (const id of prevKeys) {
        if (prev[id] !== next[id]) return true
    }

    return false
}

function calculateSpectatorRankDelta(leaderboard, prevRanks) {
    const newRanks = {}
    const delta = {}

    const isFirst = Object.keys(prevRanks).length === 0

    leaderboard.forEach((p, index) => {
        const rank = index + 1
        newRanks[p.id] = rank

        if (isFirst) {
            delta[p.id] = "same"
        } else if (!prevRanks[p.id]) {
            delta[p.id] = "new"
        } else if (rank < prevRanks[p.id]) {
            delta[p.id] = "up"
        } else if (rank > prevRanks[p.id]) {
            delta[p.id] = "down"
        } else {
            delta[p.id] = "same"
        }
    })

    return { newRanks, delta }
}



export default function QuizSpectatorView({ data }) {
    if (!data) return null

    const [timeLeft, setTimeLeft] = useState(null)
    const timerRef = useRef(null)
    const [rankDelta, setRankDelta] = useState({})
    const rankHistoryRef = useRef({})
    const lastScoresRef = useRef({})


    useEffect(() => {
  if (!Array.isArray(data?.leaderboard)) return

  const currentScores = getScoreMap(data.leaderboard)

  // 🚫 If scores didn't change → keep previous arrows
  if (!scoresChanged(lastScoresRef.current, currentScores)) {
    return
  }

  // ✅ Scores changed → recalculate rank delta
  const { newRanks, delta } =
    calculateSpectatorRankDelta(
      data.leaderboard,
      rankHistoryRef.current
    )

  rankHistoryRef.current = newRanks
  lastScoresRef.current = currentScores
  setRankDelta(delta)

}, [data?.leaderboard])




    // ⏱️ TIMER LOGIC (reuse player timer logic)
    useEffect(() => {
        if (!data?.timer?.endsAt) {
            setTimeLeft(null)
            return
        }

        if (timerRef.current) clearInterval(timerRef.current)

        const tick = () => {
            const remaining = Math.max(
                0,
                Math.ceil((data.timer.endsAt - Date.now()) / 1000)
            )
            setTimeLeft(remaining)

            if (remaining <= 0) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }

        tick()
        timerRef.current = setInterval(tick, 250)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [data?.timer?.endsAt])

    return (
        <div className="grid grid-cols-3 gap-6">

            {/* 🧠 QUESTION + TIMER */}
            <div className="col-span-2">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-300">
                        Live Question
                    </h2>

                    {data.timer && timeLeft !== null && (
                        <div className="col-span-3 flex justify-center">
                            <CircularTimer
                                timeLeft={timeLeft}
                                duration={data.timer.duration}
                            />
                        </div>
                    )}
                </div>

                <QuestionPanel question={data.question} />
            </div>

            {/* 🏆 LEADERBOARD */}
            {Array.isArray(data.leaderboard) && (
                <Leaderboard
                    leaderboard={data.leaderboard}
                    rankDelta={rankDelta}
                />
            )}


            {/* 📊 STATS */}
            <StatsPanel stats={data.stats} finished={data.finished} />
        </div>
    )
}
