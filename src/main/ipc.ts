import { app } from "electron"
import * as fs from "fs-extra"
import * as path from "path"
import { ipcMain } from "electron-better-ipc"

const rootDir = path.join(app.getPath("userData"), "identities")
console.log("rootDir:", rootDir)

const nativeApi = {
	async getIdentities() {
		await fs.mkdirp(rootDir)
		const names = await fs.readdir(rootDir)
		return names
	},
	async createIdentity(name: string) {
		const names = await nativeApi.getIdentities()
		if (names.includes(name)) {
			return { error: `${name} is already in use.` }
		}
		await fs.mkdirp(path.join(rootDir, name))
		// create rsa key
	},
}

export type NativeApi = typeof nativeApi

for (const [eventName, fn] of Object.entries(nativeApi) as any) {
	ipcMain.answerRenderer(eventName, async (data, window) => {
		console.log(`[IPC] <- ${eventName}`)
		const result = await fn(data as any)
		console.log(`[IPC] -> ${eventName}`)
		return result
	})
}
