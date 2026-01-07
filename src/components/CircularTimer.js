"use client"

export default function CircularTimer({ timeLeft, duration }) {
    const radius = 36
    const circumference = 2 * Math.PI * radius
    const progress = timeLeft / duration
    const offset = circumference * (1 - progress)

    return (
        <div className="relative w-20 h-20">
            <svg className="w-full h-full rotate-[-90deg]">
                <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="#1f2937"
                    strokeWidth="6"
                    fill="none"
                />
                <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke={timeLeft <= 5 ? "#ef4444" : "#22c55e"}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={`transition-all duration-300 ${timeLeft <= 5 ? "animate-pulse" : ""
                        }`}
                />
            </svg>

            <div
                className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${timeLeft <= 5 ? "animate-pulse text-red-400" : ""
                    }`}
            >
                {timeLeft}
            </div>
        </div>
    )
}
