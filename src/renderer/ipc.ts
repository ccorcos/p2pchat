import { NativeApi } from "../main/ipc"
import { ipcRenderer } from "electron-better-ipc"

export const nativeApi: NativeApi = new Proxy(
	{},
	{
		get: function(obj, prop: string) {
			return async function(arg) {
				console.log(`[IPC] -> ${prop}`)
				const result = await ipcRenderer.callMain(prop, arg)
				console.log(`[IPC] <- ${prop}`)
				return result
			}
		},
	}
) as any
