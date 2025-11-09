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

io.on('connection', (socket) => {
    console.log('A user has connected. Socket ID:', socket.id);
    socket.emit('canvas_history', drawingState.actionHistory);
    socket.on('set_user_name', (name) => {
        socket.userName = name;
    });
    socket.on('drawing_event',(data)=>{
        drawingState.addOperation(data);
        socket.broadcast.emit('draw_this', data);
    });
    socket.on('end_stroke', () => {
        drawingState.addStrokeMarker();
    });
    socket.on('cursor_move', (data)=>{
        socket.broadcast.emit('user_cursor',{
            id: socket.userName || socket.id,
            x: data.x,
            y: data.y,
            color: data.color,
            tool: data.tool
        });
    });
    socket.on('disconnect', () => {
        console.log('A user has disconnected. Socket ID:' , socket.id);
        io.emit('user_disconnected', socket.id);
    });
    socket.on('undo',() => {
        const newHistory = drawingState.undoLastStroke();

        if (newHistory){
            io.emit('redraw_canvas',newHistory);
        }
    });

    socket.on('redo',() => {
        const newHistory = drawingState.redoLastStroke();
        if (newHistory) {
            io.emit('redraw_canvas', newHistory);
        }
    });
    
});

server.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
});