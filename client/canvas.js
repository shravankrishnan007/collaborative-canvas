function initCanvas(canvas, ctx, socket, localCtx){
    
    


let isDrawing = false;// Flag to check if the mouse button is currently pressed down.
let lastX = 0;// Where the stroke started on the X-axis.
let lastY = 0;// Where the stroke started on the Y-axis.
let lastUsedColor = '#000000';// Gotta remember the last color, mostly for switching back from the eraser.
let recentColors = [];// Keeping track of the colors used recently.

let currentTool= 'brush';// Start with the brush.
const colorPicker = document.getElementById('color');// The actual HTML color input.
const colorSwatch = document.getElementById('color-swatch');// The visual square next to the picker.
const recentColorsContainer = document.getElementById('recent-colors-container');// Container for those little recent color squares.

const widthSlider = document.getElementById('strokeWidth');// Brush size slider.
const eraserBtn = document.getElementById('eraser-btn');// The dedicated eraser button.

const eraserWidthSlider = document.getElementById('eraserWidth');// Eraser size slider.
const eraserSliderContainer = document.getElementById('eraser-slider-container');// The container for the eraser slider, so we can hide/show it.





// When the color picker value changes...
colorPicker.addEventListener('change', () => {
    currentTool = 'brush';// Switch back to the brush tool (in case we were erasing).
    eraserBtn.classList.remove('active');// Un-highlight the eraser button.
    canvas.style.cursor = 'crosshair';// A nice crosshair cursor for drawing.
    localCtx.clearRect(0,0, localCtx.canvas.width, localCtx.canvas.height);// Clear the local Canvas jsut in case.
});

// function to manage the list of recently used colors.
function addRecentColor(color) {
    const index = recentColors.indexOf(color);
    if (index > -1){// If the color is already there-
        recentColors.splice(index, 1);// --remove it from its current spot.
    }
    recentColors.unshift(color);// Add the color to the front of the list.
    if (recentColors.length > 7){// avoid too many of them cluttering up the place.
        recentColors.pop();// kick out the oldest one if the list is full.
    }
    renderRecentColors();// update the visual display.

}
// Function to actually create and display the little recent color swatches.
function renderRecentColors(){

    recentColorsContainer.innerHTML = ''; // Start by clearing the old ones out..
    for(const color of recentColors) { // loop through the list...
        const swatch = document.createElement('div');// create a new div for each


        swatch.className = 'recent-color-swatch';
        swatch.style.backgroundColor = color;// set its color
        swatch.title = color;// tooltip so people know the hex code.
        swatch.addEventListener('click', () => {// Make them clickable--
            selectColor(color); // When clicked, switch to that color.
        });
        recentColorsContainer.appendChild(swatch);// putting it into the container.
    }

}
// This handles everything needed to switch to a new color.
function selectColor(color) {
    colorPicker.value = color;// Update the actual color picker input.
    colorSwatch.style.backgroundColor = color;// Update the visual swatch.
    lastUsedColor = color;// Remember this for later.
    currentTool = 'brush';// We are drawing now, not erasing.
    eraserBtn.classList.remove('active');// Eraser is off.
    eraserSliderContainer.classList.add('hidden');// Hide the eraser size slider.
    canvas.style.cursor = 'crosshair';// Back to the drawing cursor.
    localCtx.clearRect(0,0, localCtx.canvas.width, localCtx.canvas.height);// Clear the preview canvas.
}
// When the eraser button is clicked, we switch modes.
eraserBtn.addEventListener('click', () => {
    currentTool = 'eraser';
       

    
    eraserBtn.classList.add('active');// Highlight the button.
    eraserSliderContainer.classList.remove('hidden'); // Show the eraser size slider.
    canvas.style.cursor = 'none';// The mouse cursor disappears (we'll draw a circle preview instead).


    
    
});
// If the user clicks the color swatch while the eraser is active...
colorSwatch.addEventListener('click', () => {
    if (currentTool === 'eraser') {
        selectColor(lastUsedColor);// ...switch back to the last drawing color.
    }
});


//  double-click the swatch to pop up the native color picker.
colorSwatch.addEventListener('dblclick', () => {
    colorPicker.click();
});

colorPicker.addEventListener('input', () => {
    selectColor(colorPicker.value);

});

colorPicker.addEventListener('change', () => {
    addRecentColor(colorPicker.value);
});

function startDrawing(e) {
    isDrawing = true;// Set the flag: we are definitely drawing now.
    [lastX, lastY] = [e.offsetX, e.offsetY];// Capture the starting point of this new stroke.
    if (currentTool === 'eraser'){
        // Hide the eraser width slider while drawing so it doesn't interfere.
        eraserSliderContainer.classList.add('hidden');
    }
    
    
}






function draw(e){
    // Main Drawing Loop
    
    if (!isDrawing) return;// Stop if the mouse button isn't pressed.
    let currentWidth;
    // Determine the width based on the current tool (brush or eraser).
    if (currentTool === 'eraser') {
            currentWidth = eraserWidthSlider.value;
        } else {
            currentWidth = widthSlider.value;
        }
  
    const drawingData = {
        // Package all necessary data for this small line segment.
       lastX: lastX,
            lastY: lastY,
            x: e.offsetX,
            y: e.offsetY,
            color: colorPicker.value,
            width: currentWidth,
            tool: currentTool
    };
     drawOnCanvas_local(drawingData, ctx);// Draw the segment locally on the main canvas.
    
     socket.emit('drawing_event', drawingData);// Broadcast the drawing data to the server/other clients.
     [lastX, lastY] = [e.offsetX, e.offsetY];// Update the starting point for the next segment.

}

function drawOnCanvas_local(data ,ctx) {
    ctx.beginPath();
    ctx.lineWidth = data.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';


if (data.tool === 'eraser') {
    // THE ERASER : operation to erase pixels .
    ctx.globalCompositeOperation = 'destination-out';
} else {
    ctx.strokeStyle = data.color;
    // Normal drawing mode.
    ctx.globalCompositeOperation = 'source-over';
}

ctx.moveTo(data.lastX, data.lastY);
ctx.lineTo(data.x, data.y);
ctx.stroke();// Final command to render the line segment.
}


function stopDrawing(e){
    if (!isDrawing) return;
    isDrawing = false;// Stop drawing flag.
    ctx.beginPath();
    socket.emit('end_stroke');
}
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);// Stop drawing if the mouse leaves the canvas.
function getTouchPos(e) {
    // Calculates the touch position relative to the top-left of the canvas.
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
    };
}
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); //prevents scrolling/zoom on touch devices.
    const touchPos = getTouchPos(e);
    startDrawing({offsetX: touchPos.x, offsetY: touchPos.y});// Simulate mouse event structure.

},{passive: false}); // Flag that allows calling preventDefault().
canvas.addEventListener('touchmove',(e) => {
    e.preventDefault();
    const touchPos = getTouchPos(e);
    draw({ offsetX: touchPos.x, offsetY: touchPos.y});

},{passive: false});
canvas.addEventListener('touchend', (e) => {
    stopDrawing();
});
canvas.addEventListener('touchcancel', (e) => {
    stopDrawing();
});
canvas.addEventListener('mousemove', (e) => {
    // Broadcast the cursor position in real-time.
    socket.emit('cursor_move',{
        x: e.offsetX,
        y: e.offsetY,
        color: colorPicker.value,
        tool: currentTool
    });
    localCtx.clearRect(0, 0, localCtx.canvas.width, localCtx.canvas.height);
    if (currentTool === 'eraser') {
        drawEraserPreview(e.offsetX, e.offsetY, eraserWidthSlider.value);
    }
});
function drawEraserPreview(x,y) {
    const radius = eraserWidthSlider.value /2 ;
    localCtx.beginPath();
    localCtx.arc(x, y, radius, 0, Math.PI * 2);// Draws a circle path.
    localCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    localCtx.lineWidth = 1;
    localCtx.stroke(); // Renders the black circle outline.
    

}
}

