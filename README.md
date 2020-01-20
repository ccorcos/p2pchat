# P2P Chat

Goal: P2P chat messaging based with based on a solid event-sourcing infrastruture.

## To Do

AppStuff:

- specify save folder location.
- create an identity and save it there.
- create a file to store contact list


- setup simple peer
- send messages over wire
- persist to files


---

LogStuff:

- simplify the API for now.
- retry with backoff from the local log.
- write some basic tests.
- write an example syncing across a network.
- create tests with packet loss.

---

OldStuff:

- [ ] how to manage users, devices, keys, and broadcasting messages.
- [ ] Set up sqlite.
- [ ] Encrypt and sign each message.
- [ ] Offline retry.
- [ ] Sync accross devices.
- [ ] Send files.


**Phase 1 Foundation:** peer to peer chat application. sqlite local database. secure communication. secure database permission. sync devices. send images and files

