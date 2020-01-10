import { on } from "cluster"

// https://github.com/mafintosh/hypercore

// send + listen

interface RemoteLog {}

interface LocalLog<T> {
	append(value: T): void
}

// sync with another thing?

// var net = require('net');
// net.createServer(function (socket) {
//   socket.write('Echo server\r\n');
//   socket.on('data', function(chunk) {
//     socket.write(chunk);
//   });
//   socket.on('end', socket.end);
// });

class FileLog {}
