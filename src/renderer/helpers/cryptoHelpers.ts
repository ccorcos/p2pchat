import * as crypto from "crypto"
import { spawn } from "child_process"
import * as path from "path"
import { app } from "electron"
import * as fs from "fs-extra"

export type RSAKey = {
	privateKey: string
	publicKey: string
}

export async function makeRSAKey(): Promise<RSAKey> {
	const privateKey = await new Promise<string>((resolve, reject) => {
		const child = spawn("openssl", ["genrsa", "2048"])

		let result = ""

		child.stdout.on("data", value => {
			result += value
		})

		child.on("exit", code => {
			if (code === 0) {
				resolve(result)
			} else {
				reject(new Error(`Unexpected status code ${code}`))
			}
		})

		child.on("error", error => {
			reject(error)
		})
	})

	const publicKey = await new Promise<string>((resolve, reject) => {
		const child = spawn("openssl", ["rsa", "pubout"])

		let result = ""

		child.stdout.on("data", value => {
			result += value
		})

		child.on("exit", code => {
			if (code === 0) {
				resolve(result)
			} else {
				reject(new Error(`Unexpected status code ${code}`))
			}
		})

		child.on("error", error => {
			reject(error)
		})

		child.stdin.write(privateKey)

		child.stdin.end()
	})

	return {
		privateKey,
		publicKey,
	}
}

export function signData(args: { rsa: RSAKey; data: string }) {
	const { rsa, data } = args
	const sign = crypto.createSign("SHA256")
	sign.write(data)
	sign.end()
	return sign.sign(rsa.privateKey, "hex")
}

export function verifyData(args: {
	rsa: RSAKey
	signature: string
	data: string
}) {
	const { rsa, signature, data } = args
	const verify = crypto.createVerify("SHA256")
	verify.write(data)
	verify.end()
	return verify.verify(rsa.publicKey, signature, "hex")
}

const appDataDir = app.getPath("appData")
const rsaKeyPath = path.join(appDataDir, "rsaKey.json")

export async function loadRsaKey(): Promise<RSAKey> {
	try {
		const key: RSAKey = await fs.readJSON(rsaKeyPath)
		return key
	} catch (error) {}

	const key = await makeRSAKey()
	await fs.writeJSON(rsaKeyPath, key)
	return key
}
