import confetti from "canvas-confetti"

export function fireConfetti({
  particleCount = 120,
  spread = 70,
  origin = { y: 0.6 },
} = {}) {
  confetti({
    particleCount,
    spread,
    origin,
  })
}

export function fireSideConfetti() {
  confetti({
    particleCount: 60,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
  })

  confetti({
    particleCount: 60,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
  })
}
