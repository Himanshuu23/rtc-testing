const localVideo = document.getElementById("localVideo")
const remoteVideo = document.getElementById("remoteVideo")
const startCallButton = document.getElementById("startCall")

const ws = new WebSocket("ws://localhost:3000")

ws.onopen = () => {
	console.log("WebSocket Connection Established")
}

ws.onerror = (error) => {
	console.error(error)
}

let localStream
let peerConnection

const config = {
	iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
}

startCallButton.addEventListener('click', async () => {
	if (!peerConnection) {
		peerConnection = createPeerConnection()

		const offer = await peerConnection.createOffer()
		await peerConnection.setLocalDescription(offer)
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ offer }))
		}
	}
})

async function init() {
	localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
	localVideo.srcObject = localStream

	ws.onmessage = async (message) => {
		const reader = new FileReader()
		reader.onload = async () => {
			const data = JSON.parse(reader.result)

			if (data.offer) {
				await handleOffer(data.offer)
			} else if (data.answer) {
				await handleAnswer(data.answer)
			} else if (data.iceCandidate) {
				await handleIceCandidate(data.iceCandidate)
			}
		}
		reader.readAsText(message.data)
	}
}

async function handleOffer(offer) {
	await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
	const answer = await peerConnection.createAnswer()
	await peerConnection.setLocalDescription(answer)
	ws.send(JSON.stringify({ answer }))
}

async function handleAnswer(answer) {
	peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
}

async function handleIceCandidate(candidate) {
	try {
		await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
	} catch (error) {
		console.error("Error adding ice-candidate", error)
	}
}

function createPeerConnection() {
	const pc = new RTCPeerConnection(config)

	pc.onicecandidate = (event) => {
		if (event.candidate) {
			ws.send(JSON.stringify({ iceCandidate: event.candidate }))
		}
	}

	pc.ontrack = (event) => {
		remoteVideo.srcObject = event.streams[0]
	}

	if (localStream) {
		localStream.getTracks().forEach((track) => {
			pc.addTrack(track, localStream)
		})
	} else {
		console.error("localStream is not initialized.")
	}

	return pc
}

init()
