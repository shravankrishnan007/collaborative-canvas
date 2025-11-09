

const fs = require('fs');
const path = require('path');

const ROOMS_DIR = path.join(__dirname, 'rooms');
if (!fs.existsSync(ROOMS_DIR)){
    fs.mkdirSync(ROOMS_DIR);
}
const rooms ={};

function getRoomFile(room) {
    let safeRoomName = path.basename(room).replace(/[^a-z0-9-_]/gi, '');
    if (safeRoomName.length === 0) {
        safeRoomName = 'default-room';
    }
    return path.join(ROOMS_DIR, `${safeRoomName}.json`);
}

function getRoomState(room){
    if (rooms[room]){
        return rooms[room];
        };
    
    const roomFile = getRoomFile(room);
    if (fs.existsSync(roomFile)){
        try{
            const data = fs.readFileSync(roomFile, 'utf8');
            rooms[room] = JSON.parse(data);
            return rooms[room];
        }catch (e){
            console.error(`Error reading`, e);
        }
        }
        rooms[room]  = {
            actionHistory: [],
            redoStack: []
        };
        return rooms[room];
    }
    function saveRoomState(room) {
        const roomState = getRoomState(room);
        const roomFile = getRoomFile(room);
        try{
        fs.writeFileSync(roomFile, JSON.stringify(roomState));
        } catch (err)  {
            
                console.error(`error saving ${room}:`, err);
            }
       
    }






function clearRedo(room){
    getRoomState(room).redoStack.length = 0;
    
}

function addOperation(room ,data){
    const roomState = getRoomState(room);
    roomState.actionHistory.push(data);
    
    clearRedo(room);
}


function addStrokeMarker(room) {
    const roomState = getRoomState(room);
    roomState.actionHistory.push({type: 'stroke_end'});
    clearRedo(room);
    saveRoomState(room);

    
}

function undoLastStroke(room){
    const roomState = getRoomState(room);
    if (roomState.actionHistory.length === 0) return null;
    let lastOp = roomState.actionHistory.pop();

    
    roomState.redoStack.push(lastOp);
    while (lastOp?.type !== 'stroke_end' && roomState.actionHistory.length > 0){
        lastOp = roomState.actionHistory.pop();
        roomState.redoStack.push(lastOp);

    }
    saveRoomState(room);
    return roomState.actionHistory;

}
function redoLastStroke(room){
    const roomState = getRoomState(room);
    if (roomState.redoStack.length === 0) return null;
    let lastRedoOp = roomState.redoStack.pop();
    roomState.actionHistory.push(lastRedoOp);
    while (lastRedoOp?.type !== 'stroke_end' && roomState.redoStack.length > 0) {
        lastRedoOp = redoStack.pop();
        roomState.actionHistory.push(lastRedoOp);
    }
        saveRoomState(room);
    
        return roomState.actionHistory;
}
function getHistory(room) {
    return getRoomState(room).actionHistory;
}

module.exports = {
    
   
    
    addOperation,
    addStrokeMarker,
    undoLastStroke,
    redoLastStroke,
    getHistory
    
};



