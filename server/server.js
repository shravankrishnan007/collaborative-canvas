const path = require('path');
const http = require('http');


const express = require('express');

const { Server } = require('socket.io'); // import the Socket.IO server class.
const drawingState = require('./drawing-state');// import the module managing history/undo/redo.
const app = express(); // initialize the Express application.

const server = http.createServer(app);// create an HTTP server using the Express app.
const io = new Server(server); // attach Socket.IO to the HTTP server.
const PORT = process.env.PORT || 3000; // define the port to listen on.

const clientPath = path.join(__dirname, '..', 'client'); // define the path to the static client files.
app.use(express.static(clientPath)); // serve static files like HTML, CSS, JS from the 'client' directory.

app.get('/',(req, res) => {
    //handle the root URL request sending the main HTML file.
    
    res.sendFile(path.join(clientPath, 'index.html'));

});
const socketRoomMap = {};

io.on('connection', (socket) => {
    console.log('A user has connected. Socket ID:', socket.id);
    socket.on('join_room' , (room, userName) => {
        // a user requested to join a room.
        
        socket.join(room); // use Socket.IO's built-in room feature.
        
        socketRoomMap[socket.id] = room; // track the room for this socket internally.
        
        socket.userName = userName; // Save the user's chosen name to the socket object.
        console.log(`User ${userName} (ID: ${socket.id}) joined room: ${room}`);

        // immediately send the entire drawing history for the new room.

        socket.emit('canvas_history', drawingState.getHistory(room));
    });
    
    
    socket.on('drawing_event',(data)=>{
        // received a single line segment from a user.
        
        
        const room = socketRoomMap[socket.id];
        if (!room) return;
        drawingState.addOperation(room, data); // add this segment to the persistent history.
        socket.to(room).emit('draw_this', data); // broadcast the segment to everyone *else* in the room.
    });
    socket.on('end_stroke', () => {
        // the user finished drawing a stroke ie.when the mouse is lifted.
        const room = socketRoomMap[socket.id];
        if (!room) return;
        
        drawingState.addStrokeMarker(room);// insert the 'stroke_end' marker and save state.
    });
    socket.on('cursor_move', (data)=>{
        // received a real-time cursor position update.
        const room = socketRoomMap[socket.id];
        
        if(!room) return;
        // broadcast the cursor info to others in the room.
        
        socket.to(room).emit('user_cursor',{
            id: socket.userName || socket.id, // use the users name if available otherwise the ID.
            ...data
        
        });
    });
    
    socket.on('disconnect', () => {
        // a user closed their browser or lost connection.
        
        
        console.log('A user has disconnected. Socket ID:' , socket.id);
        const room = socketRoomMap[socket.id];
        if(room) {
            // tell everyone else in the room that this user is gone so they can remove the cursor.
            io.in(room).emit('user_disconnected' , socket.userName || socket.id);
            
            delete socketRoomMap[socket.id]; // clean up the room map.
        
        }
    
    });
    socket.on('undo',() => {
        // user triggered an undo action.
        const room = socketRoomMap[socket.id];
        if(!room) return;
        const newHistory = drawingState.undoLastStroke(room); // perform the undo operation.

        if (newHistory){
            // send the new truncated history to all clients for a full canvas redraw.
            io.in(room).emit('redraw_canvas',newHistory);
        }
    });

    socket.on('redo',() => {
        // user triggered a redo action.
        
        const room = socketRoomMap[socket.id];
        
        if(!room) return;
        const newHistory = drawingState.redoLastStroke(room); // perform the redo operation.
        if (newHistory) {
            io.in(room).emit('redraw_canvas', newHistory); // broadcast the full redraw command.
        }
    });
    
});

server.listen(PORT, '0.0.0.0',() => {
    console.log(`server is running on http://localhost:${PORT}`); // start listening for requests.
});