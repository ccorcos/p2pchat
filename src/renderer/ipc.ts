import { ipcRenderer } from "electron"

interface RPC {
	loadLog
}

ipcRenderer.on("asynchronous-reply", (event, arg) => {
	console.log(arg) // prints "pong"
})
ipcRenderer.send("asynchronous-message", "ping")
