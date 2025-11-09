const path = require('path');
const http = require('http');
const express = require('express');

const { Server } = require('socket.io');
const drawingState = require('./drawing-state');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

const clientPath = path.join(__dirname, '..', 'client');
app.use(express.static(clientPath));

app.get('/',(req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));

});
const socketRoomMap = {};

io.on('connection', (socket) => {
    console.log('A user has connected. Socket ID:', socket.id);
    socket.on('join_room' , (room, userName) => {
        socket.join(room);
        socketRoomMap[socket.id] = room;
        socket.userName = userName;
        console.log(`User ${userName} (ID: ${socket.id}) joined room: ${room}`);

        socket.emit('canvas_history', drawingState.getHistory(room));
    });
    
    
    socket.on('drawing_event',(data)=>{
        const room = socketRoomMap[socket.id];
        if (!room) return;
        drawingState.addOperation(room, data);
        socket.to(room).emit('draw_this', data);
    });
    socket.on('end_stroke', () => {
        const room = socketRoomMap[socket.id];
        if (!room) return;
        drawingState.addStrokeMarker(room);
    });
    socket.on('cursor_move', (data)=>{
        const room = socketRoomMap[socket.id];
        if(!room) return;
        socket.to(room).emit('user_cursor',{
            id: socket.userName || socket.id,
            ...data
        });
    });
    socket.on('disconnect', () => {
        console.log('A user has disconnected. Socket ID:' , socket.id);
        const room = socketRoomMap[socket.id];
        if(room) {
            io.in(room).emit('user_disconnected' , socket.userName || socket.id);
            delete socketRoomMap[socket.id];
        }
    
    });
    socket.on('undo',() => {
        const room = socketRoomMap[socket.id];
        if(!room) return;
        const newHistory = drawingState.undoLastStroke(room);

        if (newHistory){
            io.in(room).emit('redraw_canvas',newHistory);
        }
    });

    socket.on('redo',() => {
        const room = socketRoomMap[socket.id];
        if(!room) return;
        const newHistory = drawingState.redoLastStroke(room);
        if (newHistory) {
            io.in(room).emit('redraw_canvas', newHistory);
        }
    });
    
});

server.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
});