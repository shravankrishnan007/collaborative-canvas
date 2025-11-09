
const actionHistory = [];
const redoStack = [];

module.exports = {
    actionHistory,
   
    
    addOperation,
    addStrokeMarker,
    undoLastStroke,
    redoLastStroke
    
};

function clearRedo(){
    redoStack.length = 0;
}

function addOperation(data){
    actionHistory.push(data);
    clearRedo();
}


function addStrokeMarker(data) {
    actionHistory.push({type: 'stroke_end'});
    clearRedo();
}

function undoLastStroke(){
    if (actionHistory.length === 0) return null;
    let lastOp = actionHistory.pop();
    redoStack.push(lastOp);
    while (lastOp?.type !== 'stroke_end' && actionHistory.length > 0){
        lastOp = actionHistory.pop();
        redoStack.push(lastOp);

    }
    return actionHistory;

}
function redoLastStroke(){
    if (redoStack.length === 0) return null;
    let lastRedoOp = redoStack.pop();
    actionHistory.push(lastRedoOp);
    while (lastRedoOp?.type !== 'stroke_end' && redoStack.length > 0) {
        lastRedoOp = redoStack.pop();
        actionHistory.push(lastRedoOp);
    }
    
        return actionHistory;
}



