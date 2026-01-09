const setupRoomHandlers = require("./room.handlers")
const setupLobbyHandlers = require("./lobby.handlers")
const setupQuizHandlers = require("./quiz.handlers")

module.exports = function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id)

    setupRoomHandlers(io, socket)
    setupLobbyHandlers(io, socket)
    setupQuizHandlers(io, socket)
  })
}
