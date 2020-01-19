import * as _ from "lodash"
import * as t from "data-type-ts"
import { DeferredPromise } from "./DeferredPromise"
import { TimeoutPromise } from "./TimeoutPromise"

const syncStartRequest = t.object({
	required: {
		type: t.literal("sync-start"),
		logId: t.string,
		logLength: t.number,
	},
	optional: {},
})

const syncStartAccept = t.object({
	required: {
		type: t.literal("sync-start-accept"),
		logId: t.string,
		// Let's the sender know where to start.
		remoteLogLength: t.number,
		batchSize: t.number,
	},
	optional: {},
})

const syncStartDeny = t.object({
	required: {
		type: t.literal("sync-start-deny"),
		logId: t.string,
		// `-1` implies never retry.
		retryMs: t.number,
	},
	optional: {},
})

const syncStartResponse = t.or(syncStartAccept, syncStartDeny)

const syncBatchRequest = t.object({
	required: {
		type: t.literal("sync-batch"),
		logId: t.string,
		logStartIndex: t.number,
		logItems: t.array(t.any),
		logLength: t.number,
	},
	optional: {},
})

const syncBatchAck = t.object({
	required: {
		type: t.literal("sync-batch-ack"),
		logId: t.string,
		// Similar to accept-sync.
		remoteLogLength: t.number,
	},
	optional: {
		// Optionally give a wait time to throttle network bandwidth.
		waitMs: t.number,
	},
})

const syncBatchDeny = t.object({
	required: {
		type: t.literal("sync-batch-deny"),
		logId: t.string,
		// Similar to sync-start-deny.
		retryMs: t.number,
	},
	optional: {},
})

const syncBatchResponse = t.or(syncBatchAck, syncBatchDeny)

const syncRequest = t.or(syncStartRequest, syncBatchRequest)

interface Channel {
	listen(fn: (msg: unknown) => void): () => void
	send(msg: unknown): void
}

type IdleState = { type: "idle" }

type ConnectedState = {
	type: "connected"
	remoteLogLength: number
	batchSize: number
}

type ChannelState =
	| IdleState
	| ConnectedState
	| { type: "connecting"; pending: DeferredPromise<any> }
	| { type: "connect-waiting"; cancel: () => void }
	| { type: "syncing"; pending: DeferredPromise<any> }
	| { type: "sync-waiting"; cancel: () => void }

export class LocalLog {
	constructor(public id: string, private log: Array<any>) {}

	get length() {
		return this.log.length
	}

	public append(value: any) {
		this.log.push(value)
		this.syncAll()
	}

	private channels = new Map<Channel, ChannelState>()

	public pipe(channel: Channel) {
		if (this.channels.has(channel)) {
			console.warn("Already syncing this channel", this.id, channel)
			return
		}
		this.channels.set(channel, { type: "idle" })
		this.syncChannel(channel)
	}

	public unpipe(channel: Channel) {
		if (!this.channels.has(channel)) {
			console.warn("Channel is not currently being synced", this.id, channel)
			return
		}
		this.destroyChannel(channel)
	}

	private syncAll() {
		for (const channel of this.channels.keys()) {
			this.syncChannel(channel)
		}
	}

	public destroy() {
		for (const channel of this.channels.keys()) {
			this.destroyChannel(channel)
		}
	}

	private destroyChannel(channel: Channel) {
		const state = this.channels.get(channel)
		if (!state) {
			return
		}
		if (state.type === "syncing") {
			state.pending.reject(new Error("Cancelled"))
			return
		}
		if (state.type === "connect-waiting") {
			state.cancel()
		}
		if (state.type === "connecting") {
			state.pending.reject(new Error("Cancelled"))
			return
		}
		if (state.type === "sync-waiting") {
			state.cancel()
		}
		// TODO: say bye for warm connections?
	}

	private rpc<T extends { logId: string }>(
		channel: Channel,
		request: typeof syncRequest.value,
		response: t.RuntimeDataType<T>
	): DeferredPromise<T> {
		const promise = new DeferredPromise<T>()

		// Setup listener for response.
		const stop = channel.listen(msg => {
			if (response.is(msg) && msg.logId === this.id) {
				promise.resolve(msg)
			}
		})

		// Stop when resolved or if canceled.
		promise.finally(stop)

		// First off the request!
		channel.send(request)

		return promise
	}

	private async connect(channel: Channel, state: IdleState) {
		const pending = this.rpc(
			channel,
			{
				type: "sync-start",
				logId: this.id,
				logLength: this.length,
			},
			syncStartResponse
		)

		this.channels.set(channel, { type: "connecting", pending })
		const response = await pending

		if (response.type === "sync-start-deny") {
			await this.connectLater(channel, response.retryMs)
			return
		}

		this.channels.set(channel, {
			type: "connected",
			remoteLogLength: response.remoteLogLength,
			batchSize: response.batchSize,
		})
	}

	private async connectLater(channel: Channel, retryMs: number) {
		if (retryMs === -1) {
			// Remote rejected syncing request.
			this.channels.set(channel, { type: "idle" })
			this.destroyChannel(channel)
			return
		}

		if (retryMs === 0) {
			// Retry immediately
			this.channels.set(channel, { type: "idle" })
			return
		}

		// Retry later.
		const timeout = new TimeoutPromise(retryMs)
		this.channels.set(channel, {
			type: "connect-waiting",
			cancel: timeout.cancel,
		})
		await timeout
		this.channels.set(channel, { type: "idle" })
	}

	private async syncBatch(channel: Channel, state: ConnectedState) {
		const pending = this.rpc(
			channel,
			{
				type: "sync-batch",
				logId: this.id,
				logStartIndex: state.remoteLogLength,
				logItems: this.log.slice(
					state.remoteLogLength,
					state.remoteLogLength + state.batchSize
				),
				logLength: this.length,
			},
			syncBatchResponse
		)

		this.channels.set(channel, {
			type: "syncing",
			pending: pending,
		})
		const response = await pending

		if (response.type === "sync-batch-deny") {
			await this.connectLater(channel, response.retryMs)
			return
		}

		if (response.waitMs && response.waitMs > 0) {
			const timeout = new TimeoutPromise(response.waitMs)
			this.channels.set(channel, {
				type: "sync-waiting",
				cancel: timeout.cancel,
			})
			await timeout
		}

		this.channels.set(channel, {
			type: "connected",
			batchSize: state.batchSize,
			remoteLogLength: response.remoteLogLength,
		})
	}

	private async syncChannel(channel: Channel) {
		// Using a while loop instead of recusion.
		while (true) {
			const state = this.channels.get(channel) || { type: "idle" }

			if (state.type === "idle") {
				// Connect to the other side.
				await this.connect(channel, state)
				continue
			}

			if (state.type === "connected") {
				if (state.remoteLogLength === this.length) {
					// Already synced.
					break
				} else {
					// Sync another batch.
					await this.syncBatch(channel, state)
					continue
				}
			}

			break
		}
	}
}

export class RemoteLog {
	constructor(
		public id: string,
		private log: Array<any>,
		private channel: Channel
	) {
		this.destroy = this.channel.listen(this.handleRequest)
	}

	public destroy: () => void

	get length() {
		return this.log.length
	}

	private handleRequest = request => {
		if (syncStartRequest.is(request) && request.logId === this.id) {
			const response: typeof syncStartAccept.value = {
				type: "sync-start-accept",
				logId: this.id,
				remoteLogLength: this.length,
				batchSize: 200,
			}
			this.channel.send(response)
		}

		if (syncBatchRequest.is(request) && request.logId === this.id) {
			this.log.splice(request.logStartIndex, Infinity, ...request.logItems)
			// Emit locally?
			const response: typeof syncBatchAck.value = {
				type: "sync-batch-ack",
				logId: this.id,
				remoteLogLength: this.length,
			}
			this.channel.send(response)
		}
	}
}

// var net = require('net');
// net.createServer(function (socket) {
//   socket.write('Echo server\r\n');
//   socket.on('data', function(chunk) {
//     socket.write(chunk);
//   });
//   socket.on('end', socket.end);
// });
