# P2P Chat

Goal: P2P chat messaging based with based on a solid event-sourcing infrastruture.

## To Do

- need to come up with RPC abstraction for saving logs and reading logs and I realized the abstraction for loading the logs into memory is the same abstraction for syncing logs anywhere so we may as well start there. We need some kind of log event emitter abstraction that can sync from one place to another.

- 1-player messaging. append items to a log and read the log.
	- multiple chatrooms
- p2p mechanics
	- human discovery (share a link or something)
	- digital discovery (signalhub)
	- permissions
	- syncing

---

OLD

- [x] Crypto keys for each device and each user.
- [x] simple-peer and signalhub to connect users.
- [ ] how to manage users, devices, keys, and broadcasting messages.
- [ ] Set up sqlite.
- [ ] Encrypt and sign each message.
- [ ] Offline retry.
- [ ] Sync accross devices.
- [ ] Send files.



https://arkwright.github.io/event-sourcing.html