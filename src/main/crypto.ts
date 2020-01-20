import * as pgp from "openpgp"

export type Key = {
	privateKey: string
	publicKey: string
}

export type PublicKey = {
	publicKey: string
}

export async function createKey(): Promise<Key> {
	const key = await pgp.generateKey({
		userIds: [{ name: Math.random().toString() }],
		numBits: 4096,
		// passphrase: "",
	})
	return {
		publicKey: key.publicKeyArmored,
		privateKey: key.privateKeyArmored,
	}
}

type Payload = {
	publicKey: string
	signature: string
	data: string
}

async function readKey(key: string) {
	return (await pgp.key.readArmored(key)).keys[0]
}

// Using detached signatures because we don't know
export async function encrypt(args: {
	from: Key
	to: PublicKey
	data: string
}) {
	const { from, to, data } = args
	// await privateKeyObj.decrypt(passphrase)

	const { data: signature } = await pgp.sign({
		message: pgp.cleartext.fromText(data),
		privateKeys: [await readKey(from.privateKey)],
	})

	const payload: Payload = {
		publicKey: from.publicKey,
		signature: signature,
		data: data,
	}

	const text = JSON.stringify(payload)

	const { data: encryptedPayload } = await pgp.encrypt({
		message: pgp.message.fromText(text),
		publicKeys: (await pgp.key.readArmored(to.publicKey)).keys,
		armor: true,
	})

	return encryptedPayload
}

export async function decrypt(args: { key: Key; encryptedPayload: string }) {
	const { key, encryptedPayload } = args

	const { data: text } = await pgp.decrypt({
		message: await pgp.message.readArmored(encryptedPayload),
		privateKeys: [await readKey(key.privateKey)],
	})

	const payload: Payload = JSON.parse(text as string)

	const { signatures } = await pgp.verify({
		message: await pgp.cleartext.fromText(payload.data),
		publicKeys: [await readKey(payload.publicKey)],
	})

	if (!signatures[0]) {
		throw new Error("Invalid signature.")
	}

	return payload
}
