export class DeferredPromise<T> {
	public promise: Promise<T>
	public then: Promise<T>["then"]
	public catch: Promise<T>["catch"]
	public finally: Promise<T>["finally"]
	public resolve: (value: T | Promise<T>) => void
	public reject: (error: any) => void

	constructor() {
		this.promise = new Promise<T>((resolve, reject) => {
			this.resolve = resolve
			this.reject = resolve
		})
		this.then = this.promise.then.bind(this)
		this.catch = this.promise.catch.bind(this)
		this.finally = this.promise.finally.bind(this)
	}
}
