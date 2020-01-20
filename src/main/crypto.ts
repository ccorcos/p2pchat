import * as crypto from "crypto"
import { spawn } from "child_process"

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
		const child = spawn("openssl", ["rsa", "-pubout"])

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

export function sign(args: { rsaKey: RSAKey; data: string }) {
	const { rsaKey, data } = args
	const sign = crypto.createSign("SHA256")
	sign.write(data)
	sign.end()
	return sign.sign(rsaKey.privateKey, "base64")
}

export function verify(args: {
	rsaKey: RSAPublicKey
	signature: string
	data: string
}) {
	const { rsaKey, signature, data } = args
	const verify = crypto.createVerify("SHA256")
	verify.write(data)
	verify.end()
	return verify.verify(rsaKey.publicKey, signature, "base64")
}

export function encrypt(args: { rsaKey: RSAPublicKey; data: string }) {
	const { rsaKey, data } = args
	return crypto
		.publicEncrypt(rsaKey.publicKey, Buffer.from(data, "utf8"))
		.toString("base64")
}

export function decrypt(args: { rsaKey: RSAKey; data: string }) {
	const { rsaKey, data } = args
	return crypto
		.privateDecrypt(rsaKey.privateKey, Buffer.from(data, "base64"))
		.toString("utf8")
}

export type EncryptedPayload = {
	publicKey: string
	signature: string
	data: string
}

export function encryptAndSign(args: {
	from: RSAKey
	to: RSAPublicKey
	data: string
}) {
	const { to, from, data } = args
	const signature = sign({ rsaKey: from, data })
	const payload: EncryptedPayload = {
		publicKey: from.publicKey,
		signature: signature,
		data: data,
	}
	return encrypt({ rsaKey: to, data: JSON.stringify(payload) })
}

export function decryptAndVerify(args: { rsaKey: RSAKey; data: string }) {
	const { rsaKey, data } = args

	const decrypted = decrypt({ rsaKey, data })

	const payload: EncryptedPayload = JSON.parse(decrypted)

	const verified = verify({
		rsaKey: { publicKey: payload.publicKey },
		signature: payload.signature,
		data: payload.data,
	})

	if (!verified) {
		throw new Error("Invalid signature.")
	}

	return payload
}

export function createAes256Password() {
	return new Promise<string>((resolve, reject) => {
		crypto.randomBytes(256, (error, buffer) => {
			if (error) {
				reject(error)
			} else {
				resolve(buffer.toString("base64"))
			}
		})
	})
}

const aes256 = "aes-256-ctr"

export function encryptAes256(args: { data: string; password: string }) {
	const { data, password } = args
	const cipher = crypto.createCipher(aes256, Buffer.from(password, "base64"))
	const encrypted = Buffer.concat([
		cipher.update(Buffer.from(data, "utf8")),
		cipher.final(),
	])
	return encrypted.toString("base64")
}

export function decryptAes256(args: { data: string; password }) {
	const { data, password } = args
	const decipher = crypto.createDecipher(
		aes256,
		Buffer.from(password, "base64")
	)
	const decrypted = Buffer.concat([
		decipher.update(Buffer.from(data, "base64")),
		decipher.final(),
	])
	return decrypted.toString("utf8")
}

// createCipheriv
