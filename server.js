const express = require('express')
const { WebSocketServer } = require('ws')

const app = express()
const PORT = 3000

app.use(express.static('public'))

const server = app.listen(PORT, () => {
	console.log('Server running at 3000')
})

const wss = new WebSocketServer({ server })

wss.on('connection', (socket) => {
	console.log("A client connected to the server")

	socket.on("message", (message) => {
		wss.clients.forEach((client) => {
			if (client !== socket && client.readyState === client.OPEN) {
				client.send(message)
			}
		})
	})

	socket.on("close", () => {
		console.log("A client disconnected from the server")
	})
})
