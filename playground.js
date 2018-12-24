var Peer = require("simple-peer")
var wrtc = require("wrtc")

// Two peers initiating at the same time.
var peer1 = new Peer({ initiator: true, wrtc: wrtc })
var peer2 = new Peer({ wrtc: wrtc })

peer1.on("signal", function(data) {
	console.log("peer1 signal")
	peer2.signal(data)
})

peer2.on("signal", function(data) {
	console.log("peer2 signal")
	peer1.signal(data)
})

peer1.on("connect", function() {
	console.log("peer1 connect")
	peer1.send("peer1->peer2")
})

peer2.on("connect", function() {
	console.log("peer2 connect")
	peer1.send("peer2->peer1")
})

peer1.on("data", function(data) {
	console.log("peer1 data: " + data)
})

peer2.on("data", function(data) {
	console.log("peer2 data: " + data)
})
