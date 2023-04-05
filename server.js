const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');

    // Gửi yêu cầu gọi video
    socket.on('call', (data) => {
        console.log('call request');
        io.to(data.target).emit('incomingCall', {
            offer: data.offer,
            caller: data.caller
        });
    });

    // Phản hồi yêu cầu gọi video
    socket.on('answer', (data) => {
        console.log('call answered');
        io.to(data.target).emit('callAnswered', {
            answer: data.answer
        });
    });

    // Ngắt kết nối
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});
