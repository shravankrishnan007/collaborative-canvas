

const fs = require('fs');
const path = require('path');

const ROOMS_DIR = path.join(__dirname, 'rooms');// define where the room files are saved.

if (!fs.existsSync(ROOMS_DIR)){


    fs.mkdirSync(ROOMS_DIR);// Create the 'rooms' directory if it doesn't exist.
}
const rooms ={};// In-memory cache for all active room states.

function getRoomFile(room) {
    // sanitize the room name to prevent directory traversal attacks.
    let safeRoomName = path.basename(room).replace(/[^a-z0-9-_]/gi, '');


    if  (safeRoomName.length === 0) {
        safeRoomName = 'default-room';// use a fallback name if the room name is empty after sanitization.
    }
    return path.join(ROOMS_DIR, `${safeRoomName}.json`);// return the full path to the room's data file.
}


function getRoomState(room){
    //  state retrieval and loading
    if (rooms[room]){
        return rooms[room];// return from in-memory cache if available
        };
    
    const roomFile = getRoomFile(room);
    if (fs.existsSync(roomFile)){
       // If not in memory then try to load it from the disk file.
        try{
            const data = fs.readFileSync(roomFile, 'utf8');

            rooms[room] = JSON.parse(data);// Parse the JSON and save it to the in-memory cache.
            return rooms[room];
        }catch (e){
            console.error(`Error reading`, e);// Handle corrupted or unreadable files.
        }
        }
        //If neither cache nor file exists, initialize a brand new room state.
        rooms[room]  = {
            actionHistory: [],// the main list of drawing operations (segments).
            redoStack: []  // Operations moved here when an undo happens.
        };
        return rooms[room];
    }
    function saveRoomState(room) {
        // Persistance : writing to Disk
        const roomState = getRoomState(room);
        const roomFile = getRoomFile(room);
        try{
            // Convert the state to JSON and write it synchronously to the file.
        fs.writeFileSync(roomFile, JSON.stringify(roomState));
        } catch (err)  {
            
                console.error(`error saving ${room}:`, err); // Log save errors.
            }
       
    }






function clearRedo(room){
    // When a new operation is added, we must clear the redo stack (breaks the timeline).
    getRoomState(room).redoStack.length = 0;
    
}

function addOperation(room ,data){
    const roomState = getRoomState(room);
    roomState.actionHistory.push(data);  // Add the data point to the history.
    
    clearRedo(room); // Since added something new-any previous redo options are invalid.

}


function addStrokeMarker(room) {
    //this is crucial because an undo needs to rewind all segments back to the last marker.
    const roomState = getRoomState(room);
    roomState.actionHistory.push({type: 'stroke_end'});// insert a marker object into the history.
    clearRedo(room);
    saveRoomState(room);// persist the history after a stroke ends.

    
}

function undoLastStroke(room){
    //undo Logic
    const roomState = getRoomState(room);
    if (roomState.actionHistory.length === 0) return null; // can't undo an empty history.
    let lastOp = roomState.actionHistory.pop();// pop the most recent operation

    
    roomState.redoStack.push(lastOp); // move the popped operation to the redo stack.

    //keep popping and moving operations to redoStack until we hit a 'stroke_end' marker.
    while (lastOp?.type !== 'stroke_end' && roomState.actionHistory.length > 0){
        lastOp = roomState.actionHistory.pop();
        roomState.redoStack.push(lastOp);

    }
    saveRoomState(room); // save the state after the undo.
    return roomState.actionHistory; // return the current (undone) history for clients to redraw.

}
function redoLastStroke(room){
    const roomState = getRoomState(room);
    if (roomState.redoStack.length === 0) return null; // can't redo if the stack is empty.
    let lastRedoOp = roomState.redoStack.pop(); // pop the first item from the redo stack.
    roomState.actionHistory.push(lastRedoOp);// push it back onto the history.

    // keep pushing operations back to history until we find the 'stroke_end' marker.
    while (lastRedoOp?.type !== 'stroke_end' && roomState.redoStack.length > 0) {
        lastRedoOp = roomState.redoStack.pop();
        roomState.actionHistory.push(lastRedoOp);
    }
        saveRoomState(room);// save the state after the redo.
    
        return roomState.actionHistory; // return the current history.
}
function getHistory(room) {
    // simple getter to retrieve the current history array.
    return getRoomState(room).actionHistory;
}

module.exports = {

    // export all the main functions for use by the server/socket handler.
    
   
    
    addOperation,
    addStrokeMarker,
    undoLastStroke,
    redoLastStroke,
    getHistory
    
};



