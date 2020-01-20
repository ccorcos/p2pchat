import test from "ava"
import * as crypto from "../main/crypto"

test("crypto", async t => {
	const personA = await crypto.createKey()
	const personB = await crypto.createKey()
	const message =
		"This should ideally be a random message, but this will do for now."

	const encryptedPayload = await crypto.encrypt({
		from: personA,
		to: { publicKey: personB.publicKey },
		data: message,
	})
	t.not(encryptedPayload, message)

	const decrypedPayload = await crypto.decrypt({
		key: personB,
		encryptedPayload: encryptedPayload,
	})

	t.is(decrypedPayload.data, message)
	t.is(decrypedPayload.publicKey, personA.publicKey)
})
