require("dotenv").config()

const next = require("next")
const http = require("http")
const { Server } = require("socket.io")
const url = require("url")

const setupSocket = require("./socket")

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(server, { cors: { origin: "*" } })

  setupSocket(io)

  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    console.log(`🌤 Server running at ${process.env.NEXT_PUBLIC_BASE_URL}`)
  })
})
