import test from "ava"
import * as crypto from "../main/crypto"

test("publicEncrypt -> privateDecrypt", async t => {
	const personA = await crypto.generateKeyPair()
	const message =
		"This should ideally be a random message, but this will do for now."

	const encrypted = await crypto.publicEncrypt(personA, message)
	t.not(encrypted, message)

	const decryped = await crypto.privateDecrypt(personA, encrypted)

	t.is(decryped, message)
})

test("privateEncrypt -> publicDecrypt", async t => {
	const personA = await crypto.generateKeyPair()
	const message =
		"This should ideally be a random message, but this will do for now."

	const encrypted = await crypto.privateEncrypt(personA, message)
	t.not(encrypted, message)

	const decryped = await crypto.publicDecrypt(personA, encrypted)

	t.is(decryped, message)
})

test("passwordEncrypt -> passwordDecrypt", async t => {
	const password = await crypto.generatePassword()
	const message =
		"This should ideally be a random message, but this will do for now."

	const encrypted = await crypto.passwordEncrypt(password, message)
	t.not(encrypted.data, message)

	const decryped = await crypto.passwordDecrypt(password, encrypted)

	t.is(decryped, message)
})

test("encryptMessage -> decryptMessage", async t => {
	const personA = await crypto.generateKeyPair()
	const personB = await crypto.generateKeyPair()
	const message =
		"This should ideally be a random message, but this will do for now."

	const encrypted = await crypto.encryptMessage({
		from: personA,
		to: personB,
		data: message,
	})

	const decryped = await crypto.decryptMessage({
		key: personB,
		data: encrypted,
	})

	t.is(decryped.publicKey, personA.publicKey)
	t.is(decryped.data, message)
})
