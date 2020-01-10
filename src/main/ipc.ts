import { ipcMain } from "electron"

ipcMain.on("saveMessage", (event, arg) => {
	console.log(arg) // prints "ping"
	event.reply("asynchronous-reply", "pong")
})
