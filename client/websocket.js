function initWebsocket(socket, ctx, cursorCtx){

    const userCursors  = {};

    function cursorRenderLoop(){
        cursorCtx.clearRect(0, 0, cursorCtx.canvas.width, cursorCtx.canvas.height);

        for (const id in userCursors) {
            const cursor = userCursors[id];
            cursor.currentX += (cursor.targetX - cursor.currentX) * 0.2;
            cursor.currentY += (cursor.targetY - cursor.currentY) * 0.2;
            
            
            
            cursorCtx.beginPath();
           
           
            
            
            if (cursor.tool === 'eraser') {
              
               cursorCtx.arc(cursor.currentX, cursor.currentY, 8, 0, Math.PI * 2);
               cursorCtx.strokeStyle = '#000000';
               cursorCtx.lineWidth = 1;
               cursorCtx.stroke();
            }
            else{
                cursorCtx.arc(cursor.currentX, cursor.currentY, 5, 0, Math.PI * 2);
                cursorCtx.fillStyle = cursor.color;
                cursorCtx.fill()
            }
            
            cursorCtx.fillStyle = '#000000';
            cursorCtx.font = '12px Arial';
            cursorCtx.fillText(id, cursor.currentX + 10, cursor.currentY + 10);
        }

        requestAnimationFrame(cursorRenderLoop);
    }
    socket.on('connect', () =>{
        console.log('connected, socket id is :',socket.id);

    });
    socket.on('canvas_history', (history) => {
        console.log('receiving history.', history.length);
        for(const data of history){
            if (data.type !== 'stroke_end'){
                drawOnCanvas(data, ctx);
            }

        }
    });
    socket.on('draw_this', (data) => {
        console.log('recieving data',data);
        drawOnCanvas(data, ctx);
    });
    socket.on('user_cursor', (data) => {
        if (!userCursors[data.id]){
        userCursors[data.id] = {
            currentX: data.x,
            currentY: data.y,
            targetX: data.x,
            targetY: data.y,
            color: data.color
        };
    }
        userCursors[data.id].targetX = data.x;
        userCursors[data.id].targetY = data.y;
        userCursors[data.id].color = data.color;
        userCursors[data.id].tool = data.tool;

    
   
    });
    socket.on('user_disconnected', (id) => {
        delete userCursors[id];
        
    });
    socket.on('redraw_canvas', (history) =>{
        console.log('REDRAWING canvas');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
        ctx.globalCompositeOperation = 'destination-out';
    }else{
        ctx.strokeStyle = data.color;
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.moveTo(data.lastX, data.lastY);
    
    ctx.lineTo(data.x, data.y);
    
    ctx.stroke();
    }
    cursorRenderLoop();
}



