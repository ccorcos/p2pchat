import * as Peer from "simple-peer"
import * as signalhub from "signalhub"
import { Readable } from "stream"
import {
	RSAKey,
	decryptMessage,
	EncryptedMessage,
	RSAPublicKey,
	encryptMessage,
} from "./cryptoHelpers"

/*
To-Do's
- Verify the message separately from decrypting. That way we can lookup keys from a database.
- Fix race conditions when two peers try to connect to each other at the same time. Make a little
	state machine for each peer.
- We need some concept of awaiting a connection to a peer.
- How do we handle multiple devices? What channel does the device listen over? There's going to be
	collisions with other devices connecting over the same channels. This is also crucial to security.
*/

type SignalHub = {
	subscribe(channel: string): Readable
	broadcast(
		channel: string,
		message: any,
		callback: (error: Error | undefined) => void
	): void
}

const appNamespace = "p2pchat"

type ConnectionRequest = {
	type: "connectionRequest"
	data: any
}

type ConnectionResponse = {
	type: "connectionResponse"
	data: any
}

type Message = ConnectionRequest | ConnectionResponse

class ConnectionBroker {
	private hub: SignalHub
	private peers: { [publicKey: string]: Peer.Instance | undefined } = {}
	private rsaKey: RSAKey
	private listenStream: Readable

	constructor(args: { rsaKey: RSAKey }) {
		this.rsaKey = args.rsaKey

		this.hub = signalhub(appNamespace, [
			"https://signalhub-jccqtwhdwc.now.sh",
			"https://signalhub-hzbibrznqa.now.sh",
		])

		this.listenStream = this.hub.subscribe(this.rsaKey.publicKey)
		this.listenStream.on("data", (data: EncryptedMessage) => {
			const decrypted = decryptMessage({
				message: data,
				rsa: this.rsaKey,
				// TODO: maybe fetch this from a database and do this first!
				knownPublicKeys: new Set<string>(),
			})
			if (!decrypted) {
				return
			}
			const message: Message = JSON.parse(decrypted)
			if (message.type === "connectionRequest") {
				this.handleConnectionRequest({
					from: { publicKey: data.from.publicKey },
					message: message,
				})
			} else if (message.type === "connectionResponse") {
				this.handleConnectionResponse({
					from: { publicKey: data.from.publicKey },
					message: message,
				})
			}
		})
	}

	public destroy() {
		const publicKeys = Object.keys(this.peers)
		for (const publicKey in publicKeys) {
			const peer = this.peers[publicKey]
			if (peer) {
				peer.destroy()
				delete this.peers[publicKey]
			}
		}
		this.listenStream.destroy()
	}

	private async connectToPeer(args: { rsa: RSAPublicKey }) {
		const { rsa } = args
		const peer = new Peer({ initiator: true, objectMode: true })
		this.peers[rsa.publicKey] = peer

		peer.on("signal", data => {
			this.sendPublicMessage({
				to: rsa,
				message: {
					type: "connectionRequest",
					data: data,
				},
			})
		})

		await new Promise(resolve => peer.on("connect", resolve))

		// peer.send({})
		// peer.on("data", data => {})
		// peer.destory

		return peer
	}

	private handleConnectionRequest(args: {
		from: RSAPublicKey
		message: ConnectionRequest
	}) {
		const { from, message } = args
		const peer = new Peer({ objectMode: true })
		this.peers[from.publicKey] = peer

		peer.on("signal", data => {
			this.sendPublicMessage({
				to: from,
				message: {
					type: "connectionResponse",
					data: data,
				},
			})
		})

		peer.signal(message.data)
	}

	private handleConnectionResponse(args: {
		from: RSAPublicKey
		message: ConnectionResponse
	}) {
		const { from, message } = args
		const peer = this.peers[from.publicKey]
		if (!peer) {
			console.log(
				"Connection response without existing peer request from " +
					from.publicKey
			)
			return
		}

		peer.signal(message.data)
	}

	private async sendPublicMessage(args: {
		to: RSAPublicKey
		message: Message
	}) {
		const { hub, rsaKey } = this
		const { message, to } = args

		const encrypted = encryptMessage({
			to: to,
			from: rsaKey,
			data: JSON.stringify(message),
		})

		await new Promise((resolve, reject) =>
			hub.broadcast(to.publicKey, encrypted, error =>
				error ? reject(error) : resolve()
			)
		)
	}
}
