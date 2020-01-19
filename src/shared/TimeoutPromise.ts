import { DeferredPromise } from "./DeferredPromise"

export class TimeoutPromise extends DeferredPromise<void> {
	private timerId: any
	constructor(waitMs: number) {
		super()
		this.timerId = setTimeout(this.resolve, waitMs)
	}
	cancel = () => {
		clearTimeout(this.timerId)
		this.reject(new Error("Timeout canceled."))
	}
}
