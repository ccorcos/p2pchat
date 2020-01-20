import * as Peer from "simple-peer"
import * as signalhub from "signalhub"
import { Readable } from "stream"
import { Key, PublicKey, decrypt, encrypt } from "./crypto"

type SignalHub = {
	subscribe(channel: string): Readable
	broadcast(
		channel: string,
		message: any,
		callback: (error: Error | undefined) => void
	): void
}

const appNamespace = "p2pchat"

type PeerSignal = {
	type: "signal"
	initiator: boolean
	data: any
}

type Message = PeerSignal

type Connection = {
	initiator: boolean
	peer: Peer.Instance
	connected: ResolveablePromise
}

export class ConnectionBroker {
	private hub: SignalHub
	private connections: { [publicKey: string]: Connection | undefined } = {}
	private key: Key
	private listenStream: Readable
	private shouldConnect: (key: PublicKey) => Promise<boolean>

	constructor(args: {
		key: Key
		shouldConnect: (key: PublicKey) => Promise<boolean>
	}) {
		this.key = args.key
		this.shouldConnect = args.shouldConnect

		this.hub = signalhub(appNamespace, [
			"https://signalhub-jccqtwhdwc.now.sh",
			"https://signalhub-hzbibrznqa.now.sh",
		])

		this.listenStream = this.hub.subscribe(this.key.publicKey)
		this.listenStream.on("data", async (encryptedPayload: string) => {
			const payload = await decrypt({
				key: this.key,
				encryptedPayload: encryptedPayload,
			})

			// Check if the public key should be trusted with a connection.
			const connect = await this.shouldConnect({ publicKey: payload.publicKey })
			if (!connect) {
				console.log("Denied connection to " + payload.publicKey)
				return
			}

			const message: PeerSignal = JSON.parse(payload.data)

			if (message.type === "signal") {
				this.handleSignal({
					from: { publicKey: payload.publicKey },
					message: message,
				})
			}
		})
	}

	public destroy() {
		const publicKeys = Object.keys(this.connections)
		for (const publicKey in publicKeys) {
			const connection = this.connections[publicKey]
			if (connection) {
				connection.peer.destroy()
				delete this.connections[publicKey]
			}
		}
		this.listenStream.destroy()
	}

	// peer.send({})
	// peer.on("data", data => {})
	// peer.destory

	public async connect(args: { key: PublicKey }) {
		const { key } = args

		const existingConnection = this.connections[key.publicKey]
		if (existingConnection) {
			await existingConnection.connected
			return existingConnection.peer
		} else {
			const peer = new Peer({ initiator: true, objectMode: true })
			const connected = new ResolveablePromise()
			this.connections[key.publicKey] = {
				initiator: true,
				peer: peer,
				connected: connected,
			}

			peer.on("signal", data => {
				this.sendPublicMessage({
					to: key,
					message: {
						type: "signal",
						initiator: true,
						data: data,
					},
				})
			})

			peer.on("connect", connected.resolve)
			await connected

			return peer
		}
	}

	private handleSignal(args: { from: PublicKey; message: PeerSignal }) {
		const { from, message } = args
		const existingConnection = this.connections[from.publicKey]
		if (existingConnection) {
			// Race condition where both are initiating at the same time.
			if (message.initiator && existingConnection.initiator) {
				// Keep the connection with the larger key.
				if (from.publicKey > this.key.publicKey) {
					// Destroy this connection and make a new one.
					existingConnection.peer.destroy()

					const peer = new Peer({ objectMode: true })
					const connected = existingConnection.connected
					this.connections[from.publicKey] = {
						initiator: false,
						peer: peer,
						connected: connected,
					}

					peer.on("signal", data => {
						this.sendPublicMessage({
							to: from,
							message: {
								type: "signal",
								initiator: false,
								data: data,
							},
						})
					})

					peer.on("connect", connected.resolve)
					peer.signal(message.data)
				} else {
					existingConnection.peer.signal(message.data)
				}
			} else {
				existingConnection.peer.signal(message.data)
			}
		} else {
			const peer = new Peer({ objectMode: true })
			const connected = new ResolveablePromise()
			this.connections[from.publicKey] = {
				initiator: false,
				peer: peer,
				connected: connected,
			}

			peer.on("signal", data => {
				this.sendPublicMessage({
					to: from,
					message: {
						type: "signal",
						initiator: false,
						data: data,
					},
				})
			})

			peer.on("connect", connected.resolve)
			peer.signal(message.data)
		}
	}

	private async sendPublicMessage(args: { to: PublicKey; message: Message }) {
		const { hub, key } = this
		const { message, to } = args

		const encrypted = encrypt({
			to: to,
			from: key,
			data: JSON.stringify(message),
		})

		await new Promise((resolve, reject) =>
			hub.broadcast(to.publicKey, encrypted, error =>
				error ? reject(error) : resolve()
			)
		)
	}
}

class ResolveablePromise<T = void> extends Promise<T> {
	resolve: (arg: T) => void
	reject: (error: any) => void
	constructor() {
		super((resolve, reject) => {
			this.resolve = resolve
			this.reject = reject
		})
	}
}
