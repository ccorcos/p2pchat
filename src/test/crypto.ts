import test from "ava"

import * as crypto from "../main/crypto"

test("aes256", async t => {
	const password = await crypto.createAes256Password()
	const message = "random message"

	const encryptedMessage = crypto.encryptAes256({ password, data: message })
	t.not(encryptedMessage, message)

	const decrypedMessage = crypto.decryptAes256({
		password,
		data: encryptedMessage,
	})

	t.is(decrypedMessage, message)
})

test("rsa", async t => {
	const rsaKey = await crypto.createRSAKey()
	const message = "small message"
	const encryptedMessage = crypto.encrypt({ rsaKey, data: message })
	t.not(encryptedMessage, message)
	const decrypedMessage = crypto.decrypt({ rsaKey, data: encryptedMessage })
	t.is(decrypedMessage, message)
})

// test("encryptAndSign + decryptAndVerify", async t => {
// 	const personA = await crypto.createRSAKey()
// 	const personB = await crypto.createRSAKey()
// 	const message =
// 		"Ideally, this would be a bunch of random data, but this is good enough."
// 	const encryptedMessage = crypto.encryptAndSign({
// 		from: personA,
// 		to: personB,
// 		data: message,
// 	})
// 	t.not(encryptedMessage, message)
// 	const decrypedMessage = crypto.decryptAndVerify({
// 		rsaKey: personB,
// 		data: encryptedMessage,
// 	})
// 	t.is(decrypedMessage.data, message)
// })
