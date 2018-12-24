const { spawn } = require("child_process")

const child = spawn("openssl", ["genrsa", "2048"])

let result = ""

child.stdout.on("data", value => {
	result += value
})

child.on("exit", () => {
	console.log(result)
})

child.on("error", error => {
	console.log(error)
})
