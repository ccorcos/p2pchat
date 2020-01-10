import * as crypto from "crypto"
import { spawn } from "child_process"
import * as path from "path"
import { app } from "electron"
import * as fs from "fs-extra"

export type RSAKey = {
	privateKey: string
	publicKey: string
}

export type RSAPublicKey = {
	publicKey: string
}

export async function createRSAKey(): Promise<RSAKey> {
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

export function sign(args: { rsa: RSAKey; data: string }) {
	const { rsa, data } = args
	const sign = crypto.createSign("SHA256")
	sign.write(data)
	sign.end()
	return sign.sign(rsa.privateKey, "hex")
}

export function verify(args: {
	rsa: RSAPublicKey
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

export async function loadRSAKey() {
	try {
		const key: RSAKey = await fs.readJSON(rsaKeyPath)
		return key
	} catch (error) {}
}

export async function writeRSAKey(rsaKey: RSAKey) {
	await fs.writeJSON(rsaKeyPath, rsaKey)
}

// export async function initRSAKey() {
// 	const key = await createRSAKey()
// 	await fs.writeJSON(rsaKeyPath, key)
// 	return key
// }

export function encrypt(args: { rsa: RSAPublicKey; data: string }) {
	const { rsa, data } = args
	return crypto
		.publicEncrypt(rsa.publicKey, Buffer.from(data, "utf8"))
		.toString("base64")
}

export function decrypt(args: { rsa: RSAKey; data: string }) {
	const { rsa, data } = args
	return crypto
		.privateDecrypt(rsa.privateKey, Buffer.from(data, "base64"))
		.toString("utf8")
}

export type EncryptedMessage = {
	data: string
	from: {
		publicKey: string
		signature: string
	}
}

export function encryptMessage(args: {
	to: RSAPublicKey
	from: RSAKey
	data: string
}): EncryptedMessage {
	const { to, from, data } = args
	const encryptedData = encrypt({ rsa: to, data: data })
	const signature = sign({ rsa: from, data: encryptedData })
	return {
		data: encryptedData,
		from: {
			publicKey: from.publicKey,
			signature: signature,
		},
	}
}

export function decryptMessage(args: {
	message: EncryptedMessage
	rsa: RSAKey
}) {
	const { rsa, message } = args

	const verified = verify({
		rsa: { publicKey: message.from.publicKey },
		signature: message.from.signature,
		data: message.data,
	})
	if (!verified) {
		return
	}

	const decrypted = decrypt({ rsa: rsa, data: message.data })

	return decrypted
}
