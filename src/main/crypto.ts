import * as crypto from "crypto"

export type Key = {
	privateKey: string
	publicKey: string
}

export type PublicKey = {
	publicKey: string
}

export async function generateKeyPair() {
	return new Promise<Key>((resolve, reject) => {
		crypto.generateKeyPair(
			"rsa",
			{
				modulusLength: 4096,
				publicKeyEncoding: { type: "spki", format: "pem" },
				privateKeyEncoding: { type: "pkcs8", format: "pem" },
			},
			(err, publicKey, privateKey) => {
				// Handle errors and use the generated key pair.
				resolve({ publicKey, privateKey })
			}
		)
	})
}

export function publicEncrypt(key: PublicKey, text: string) {
	console.log("publicEncrypt", text)
	const encrypted = crypto.publicEncrypt(key.publicKey, Buffer.from(text))
	return encrypted.toString("base64")
}

export function publicDecrypt(key: PublicKey, text: string) {
	const decrypted = crypto.publicDecrypt(
		key.publicKey,
		Buffer.from(text, "base64")
	)
	return decrypted.toString("utf8")
}

export function privateEncrypt(key: Key, text: string) {
	const encrypted = crypto.privateEncrypt(key.privateKey, Buffer.from(text))
	return encrypted.toString("base64")
}

export function privateDecrypt(key: Key, text: string) {
	const decrypted = crypto.privateDecrypt(
		key.privateKey,
		Buffer.from(text, "base64")
	)
	return decrypted.toString("utf8")
}

const aes256 = "aes-256-cbc"
const passwordBytes = 32
const ivLength = 16

export function generatePassword() {
	return crypto.randomBytes(passwordBytes).toString("base64")
}

export function passwordEncrypt(password: string, text: string) {
	// https://gist.github.com/vlucas/2bd40f62d20c1d49237a109d491974eb
	let iv = crypto.randomBytes(ivLength)
	let cipher = crypto.createCipheriv(
		aes256,
		Buffer.from(password, "base64"),
		iv
	)
	let encrypted = cipher.update(text)
	encrypted = Buffer.concat([encrypted, cipher.final()])
	return {
		iv: iv.toString("base64"),
		data: encrypted.toString("base64"),
	}
}

export function passwordDecrypt(
	password: string,
	payload: { iv: string; data: string }
) {
	// https://gist.github.com/vlucas/2bd40f62d20c1d49237a109d491974eb
	let iv = Buffer.from(payload.iv, "base64")
	let encryptedText = Buffer.from(payload.data, "base64")
	let decipher = crypto.createDecipheriv(
		aes256,
		Buffer.from(password, "base64"),
		iv
	)
	let decrypted = decipher.update(encryptedText)
	decrypted = Buffer.concat([decrypted, decipher.final()])
	return decrypted.toString()
}

export function encryptMessage(args: {
	from: Key
	to: PublicKey
	data: string
}) {
	const { from, to, data } = args
	const password = generatePassword()
	const signedPassword = privateEncrypt(from, data)

	return {
		head: publicEncrypt(
			to,
			JSON.stringify({
				publicKey: from.publicKey,
				signedPassword: signedPassword,
			})
		),
		body: passwordEncrypt(password, data),
	}
}

export function decryptMessage(args: {
	key: Key
	data: { head: string; body: { iv: string; data: string } }
}) {
	const { key, data } = args

	const { publicKey, signedPassword } = JSON.parse(
		privateDecrypt(key, data.head)
	)
	const password = publicDecrypt(publicKey, signedPassword)

	return {
		publicKey: publicKey,
		data: passwordDecrypt(password, data.body),
	}
}
