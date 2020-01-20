// async function readKey(key: string) {
// 	return (await pgp.key.readArmored(key)).keys[0]
// }

// ;(async () => {
// 	const parsonA = await createKey()
// 	const parsonB = await createKey()

// 	const message = "hello world this might be a longish message..."

// 	// const result = await pgp.encrypt({
// 	// 	message: pgp.message.fromText(message),
// 	// 	publicKeys: [await readKey(parsonB.publicKey)],
// 	// 	armor: true,
// 	// })

// 	// console.log("result:\n", result)

// 	// const result2 = await pgp.decrypt({
// 	// 	message: await pgp.message.readArmored(result.data),
// 	// 	privateKeys: [await readKey(parsonB.privateKey)],
// 	// })
// 	// console.log("result2:\n", result2)

// 	const sign = await pgp.sign({
// 		message: pgp.message.fromText(message),
// 		privateKeys: [await readKey(parsonA.privateKey)],
// 		armor: true,
// 	})

// 	console.log("sign:\n", sign)

// 	const verify = await pgp.verify({
// 		message: await pgp.message.readArmored(sign.data),
// 		publicKeys: [await readKey(parsonA.publicKey)],
// 	})

// 	console.log("verify:\n", verify)
// })()

// // // Using detached signatures because we don't know
// // export async function encrypt(args: {
// // 	from: Key
// // 	to: PublicKey
// // 	data: string
// // }) {
// // 	const { from, to, data } = args
// // 	// await privateKeyObj.decrypt(passphrase)

// // 	const { data: signature } = await pgp.sign({
// // 		message: pgp.cleartext.fromText(data),
// // 		privateKeys: [await readKey(from.privateKey)],
// // 	})

// // 	const payload: Payload = {
// // 		publicKey: from.publicKey,
// // 		signature: signature,
// // 	}

// // 	const text = JSON.stringify(payload)

// // 	const { data: encryptedPayload } = await pgp.encrypt({
// // 		message: pgp.message.fromText(text),
// // 		publicKeys: (await pgp.key.readArmored(to.publicKey)).keys,
// // 		armor: true,
// // 	})

// // 	console.log(payload)

// // 	return encryptedPayload
// // }

// // export async function decrypt(args: { key: Key; encryptedPayload: string }) {
// // 	const { key, encryptedPayload } = args

// // 	const { data: text } = await pgp.decrypt({
// // 		message: await pgp.message.readArmored(encryptedPayload),
// // 		privateKeys: [await readKey(key.privateKey)],
// // 	})

// // 	const payload: Payload = JSON.parse(text as string)

// // 	console.log(payload)

// // 	const { signatures, data } = await pgp.verify({
// // 		message: await pgp.cleartext.fromText(payload.signature),
// // 		publicKeys: [await readKey(payload.publicKey)],
// // 	})

// // 	if (!signatures[0]) {
// // 		throw new Error("Invalid signature.")
// // 	}

// // 	return {publicKey: payload.publicKey, data: data as string}}
// // // }

// ;(async () => {
// 	const personA = await createKey()

// 	console.log(publicEncrypt(personA.publicKey, "hello"))

// 	console.log(
// 		privateDecrypt(
// 			personA.privateKey,
// 			publicEncrypt(personA.publicKey, "hello")
// 		)
// 	)

// 	// const parsonB = await createKey()

// 	// const message = "hello world"

// 	// // https://gist.github.com/vlucas/2bd40f62d20c1d49237a109d491974eb

// 	// const result = await pgp.encrypt({
// 	// 	message: pgp.message.fromText(message),
// 	// 	// privateKeys: [await readKey(parsonA.privateKey)],
// 	// 	publicKeys: [await readKey(parsonB.publicKey)],
// 	// 	armor: true,
// 	// })

// 	// console.log("result:\n", result)

// 	// const result2 = await pgp.decrypt({
// 	// 	message: await pgp.message.readArmored(result.data),
// 	// 	privateKeys: [await readKey(parsonB.privateKey)],
// 	// 	// publicKeys: [await readKey(parsonA.publicKey)],
// 	// })
// 	// console.log("result2:\n", result2)
// 	// // // console.log("verify:\n", signatures[0].valid)
// 	// // console.log("data:\n", data)
// })()
