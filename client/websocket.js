function initWebsocket(socket, ctx, cursorCtx){

    const userCursors  = {}; // In-memory object to store the position and state of all other user cursors.

    function cursorRenderLoop(){
        cursorCtx.clearRect(0, 0, cursorCtx.canvas.width, cursorCtx.canvas.height);

        for (const id in userCursors) { // Loop through every connected user's cursor data.
            const cursor = userCursors[id];
            // This makes remote cursors look much less choppy than raw updates.
            cursor.currentX += (cursor.targetX - cursor.currentX) * 0.2;
            cursor.currentY += (cursor.targetY - cursor.currentY) * 0.2;
            
            
            
            cursorCtx.beginPath();
           
           
            
            
            if (cursor.tool === 'eraser') {

                // Draw a simple black circle outline for the eraser tool.
              
               cursorCtx.arc(cursor.currentX, cursor.currentY, 8, 0, Math.PI * 2);
               cursorCtx.strokeStyle = '#000000';
               cursorCtx.lineWidth = 1;
               cursorCtx.stroke();
            }
            else{

                // Draw a solid colored circle for the brush/pen tool.
                cursorCtx.arc(cursor.currentX, cursor.currentY, 5, 0, Math.PI * 2);
                cursorCtx.fillStyle = cursor.color;
                cursorCtx.fill()
            }
            // Label the cursor with the user's ID (the socket ID).
            cursorCtx.fillStyle = '#000000';
            cursorCtx.font = '12px Arial';
            cursorCtx.fillText(id, cursor.currentX + 10, cursor.currentY + 10);
        }

        requestAnimationFrame(cursorRenderLoop); // Request the next frame to keep the animation running smoothly.
    }
    socket.on('connect', () =>{
        console.log('connected, socket id is :',socket.id); // Confirmation of connection

    });
    socket.on('canvas_history', (history) => {
        // Received the full drawing history when connecting to a room.
        console.log('receiving history.', history.length);
        // Loop through history and draw everything skipping the 'stroke_end' markers.
        for(const data of history){
            if (data.type !== 'stroke_end'){
                drawOnCanvas(data, ctx);
            }

        }
    });
    socket.on('draw_this', (data) => {
        // received a single real-time drawing segment from another user.
        console.log('recieving data',data);
        drawOnCanvas(data, ctx); // immediately draw it to the main canvas.
    });
    socket.on('user_cursor', (data) => {
        // received an update on another user's mouse position.
        if (!userCursors[data.id]){
            // if this is the first time we've seen this user initialize their cursor state.
        userCursors[data.id] = {
            currentX: data.x, // start current position at the target to avoid jump.
            currentY: data.y,
            targetX: data.x,
            targetY: data.y,
            color: data.color
        };
    }
        // always update the target position—the animation loop handles moving 'current' towards 'target'.
        userCursors[data.id].targetX = data.x;
        userCursors[data.id].targetY = data.y;
        userCursors[data.id].color = data.color;
        userCursors[data.id].tool = data.tool;

    
   
    });
    socket.on('user_disconnected', (id) => {
        // a user left so remove their cursor data.
        delete userCursors[id];
        
    });
    socket.on('redraw_canvas', (history) =>{
        // received a full history update likely due to an undo/redo operation.
        console.log('REDRAWING canvas');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Redraw the newly truncated history.
        for (const data of history) {
            if (data.type !== 'stroke_end') {
                drawOnCanvas(data, ctx);
            }
            
        }
    });
   
    

function drawOnCanvas(data, ctx){
    ctx.beginPath();
    ctx.lineWidth = data.width;
  
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (data.tool === 'eraser'){
        // apply the special eraser mode.
        ctx.globalCompositeOperation = 'destination-out';
    }else{
        ctx.strokeStyle = data.color;
        // apply normal drawing mode.
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.moveTo(data.lastX, data.lastY);
    
    ctx.lineTo(data.x, data.y);
    
    ctx.stroke();
    }
    cursorRenderLoop(); // start the animation loop when the function initializes.
}



