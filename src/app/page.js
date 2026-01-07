import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center px-6 relative overflow-hidden bg-[#0B0F19] text-white">

      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-yellow-500/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-orange-500/10 blur-[140px] rounded-full" />
      </div>

      {/* Navbar */}
      <nav className="w-full flex justify-between items-center px-8 py-6 max-w-7xl">
        <h1 className="text-xl font-bold tracking-wide">
          🌞 Sun-Fun
        </h1>

        <div className="hidden md:flex gap-6 text-sm text-gray-300">
          <span className="hover:text-white transition cursor-pointer">Games</span>
          <span className="hover:text-white transition cursor-pointer">Platform</span>
          <span className="hover:text-white transition cursor-pointer">Contact</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center mt-24 max-w-4xl">
        <h2 className="text-4xl md:text-6xl font-extrabold leading-tight">
          Play{" "}
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Together
          </span>
          .
          <br />
          Create Rooms. Choose Games.
        </h2>

        <p className="mt-6 text-gray-300 text-lg max-w-2xl">
          Sun-Fun is a real-time multiplayer platform where friends create private
          rooms, select from fun interactive games, and play together — all in
          one smooth experience.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link href="/create">
            <button className="px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300">
              Create Lobby 🚀
            </button>
          </Link>

          <Link href="/join">
            <button className="px-8 py-4 rounded-xl font-semibold border border-gray-600 hover:border-gray-400 hover:bg-white/5 transition-all duration-300">
              Join Lobby 🎮
            </button>
          </Link>
        </div>
      </section>

      {/* Games Section */}
      <section className="mt-32 max-w-6xl w-full text-center">
        <h3 className="text-3xl font-bold mb-4">
          Games on <span className="text-yellow-400">Sun-Fun</span>
        </h3>

        <p className="text-gray-400 mb-12">
          Choose a game after creating a lobby. More games coming soon.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GameCard
            title="🤖 AI Multiplayer Quiz"
            status="Available"
            description="Vote on topics, answer together, and compete in AI-generated quizzes in real-time."
          />

          <GameCard
            title="⚡ Rapid Fire"
            status="Coming Soon"
            description="Fast-paced rounds where speed matters more than anything."
            disabled
          />

          <GameCard
            title="🧠 Guess the AI"
            status="Coming Soon"
            description="Can you tell whether the answer was written by a human or AI?"
            disabled
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-32 mb-10 text-sm text-gray-500 text-center">
        <p>
          Created with ❤️ by{" "}
          <span className="text-gray-300 font-medium">
            Sunandhit Gupta
          </span>
        </p>

        <a
          href="https://www.linkedin.com/in/sunandhit-gupta-412933217/?originalSubdomain=in"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-yellow-400 hover:text-orange-400 transition"
        >
          Connect on LinkedIn →
        </a>

        <p className="mt-2 text-xs text-gray-600">
          Sun-Fun © {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  )
}

/* ---------------- Components ---------------- */

function GameCard({ title, description, status, disabled }) {
  return (
    <div
      className={`rounded-2xl p-6 border transition-all duration-300
      ${
        disabled
          ? "bg-[#0f1629] border-white/5 opacity-60"
          : "bg-[#111827] border-white/10 hover:-translate-y-1 hover:border-yellow-400/40"
      }`}
    >
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-gray-400 text-sm mb-4">{description}</p>

      <span
        className={`text-xs px-3 py-1 rounded-full font-medium
        ${
          status === "Available"
            ? "bg-green-500/20 text-green-400"
            : "bg-gray-500/20 text-gray-400"
        }`}
      >
        {status}
      </span>
    </div>
  )
}
