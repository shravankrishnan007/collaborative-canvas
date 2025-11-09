window.addEventListener('load', () => {
    const joinScreen = document.getElementById('join-screen');
    const appContainer = document.getElementById('app-container');
    const roomNameInput = document.getElementById('room-name-input');
    const joinRoomBtn = document.getElementById('join-room-btn');
    
    const socket = io();
    joinRoomBtn.addEventListener('click', () =>{
        const roomName = roomNameInput.value.trim();
        if(!roomName) {
            alert('please enter a room name.');
            return;
        }
        const guestName = `Guest+${Math.floor(Math.random() * 1000)}`;
        const userName = prompt("enter your name:", guestName) || guestName;  
        socket.emit('join_room', roomName , userName);
        joinScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        initializeApp()  
    });
    function initializeApp(){
        const fpsCounter = document.getElementById('fps-counter');
        let lastFrameTime = performance.now();
        let frameCount = 0;
        function updateFPS() {
        const now = performance.now();
        const deltaTime = now - lastFrameTime;
        lastFrameTime = now;
        const fps = Math.round(1000 / deltaTime);
        frameCount++;
        if (frameCount % 60 === 0) { 
            fpsCounter.textContent = `FPS: ${fps}`;

        }
        requestAnimationFrame(updateFPS);
    }
    updateFPS();
        

        const canvas = document.getElementById('drawing-canvas');
        if (!canvas) {
        alert("Fatal Error: Canvas element not found. kindly contact support");
        return;
        }
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 600;


        const cursorCanvas = document.getElementById('cursor-canvas');
        const cursorCtx = cursorCanvas.getContext('2d');
        cursorCanvas.width = 800;
        cursorCanvas.height = 600;

        const localCursorCanvas = document.getElementById('local-cursor-canvas');
        const localCtx = localCursorCanvas.getContext('2d');
        localCursorCanvas.width = 800;
        localCursorCanvas.height = 600;

        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        initCanvas(canvas, ctx, socket, localCtx);
        initWebsocket(socket, ctx, cursorCtx);
        console.log("initialized");
        undoBtn.addEventListener('click', () => {
        socket.emit('undo');
    });

    redoBtn.addEventListener('click', () => {
        socket.emit('redo');
    });
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z'){
        e.preventDefault();
        console.log('Ctrl+Z pressed');
        socket.emit('undo');
    }
    if ((e.ctrlKey || e.metaKey) && e.key ==='y'){
        e.preventDefault();
        socket.emit('redo');
    }
});

}
    
});
