function initCanvas(canvas, ctx, socket, localCtx){
    
    


let isDrawing = false;
let lastX = 0;
let lastY = 0;
let lastUsedColor = '#000000';
let recentColors = [];

let currentTool= 'brush';
const colorPicker = document.getElementById('color');
const colorSwatch = document.getElementById('color-swatch');
const recentColorsContainer = document.getElementById('recent-colors-container');

const widthSlider = document.getElementById('strokeWidth');
const eraserBtn = document.getElementById('eraser-btn');

const eraserWidthSlider = document.getElementById('eraserWidth');
const eraserSliderContainer = document.getElementById('eraser-slider-container');





colorPicker.addEventListener('change', () => {
    currentTool = 'brush';
    eraserBtn.classList.remove('active');
    canvas.style.cursor = 'crosshair';
    localCtx.clearRect(0,0, localCtx.canvas.width, localCtx.canvas.height);
});

function addRecentColor(color) {
    const index = recentColors.indexOf(color);
    if (index > -1){
        recentColors.splice(index, 1);
    }
    recentColors.unshift(color);
    if (recentColors.length > 7){
        recentColors.pop();
    }
    renderRecentColors();

}

function renderRecentColors(){

    recentColorsContainer.innerHTML = '';
    for(const color of recentColors) {
        const swatch = document.createElement('div');

        swatch.className = 'recent-color-swatch';
        swatch.style.backgroundColor = color;
        swatch.title = color;
        swatch.addEventListener('click', () => {
            selectColor(color);
        });
        recentColorsContainer.appendChild(swatch);
    }

}

function selectColor(color) {
    colorPicker.value = color;
    colorSwatch.style.backgroundColor = color;
    lastUsedColor = color;
    currentTool = 'brush';
    eraserBtn.classList.remove('active');
    eraserSliderContainer.classList.add('hidden');
    canvas.style.cursor = 'crosshair';
    localCtx.clearRect(0,0, localCtx.canvas.width, localCtx.canvas.height);
}

eraserBtn.addEventListener('click', () => {
    currentTool = 'eraser';
       

    
    eraserBtn.classList.add('active');
    eraserSliderContainer.classList.remove('hidden');
    canvas.style.cursor = 'none';

    
    
});

colorSwatch.addEventListener('click', () => {
    if (currentTool === 'eraser') {
        selectColor(lastUsedColor);
    }
});

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
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
    if (currentTool === 'eraser'){
        eraserSliderContainer.classList.add('hidden');
    }
    
    
}






function draw(e){
    
    if (!isDrawing) return;
    let currentWidth;
    if (currentTool === 'eraser') {
            currentWidth = eraserWidthSlider.value;
        } else {
            currentWidth = widthSlider.value;
        }
  
    const drawingData = {
       lastX: lastX,
            lastY: lastY,
            x: e.offsetX,
            y: e.offsetY,
            color: colorPicker.value,
            width: currentWidth,
            tool: currentTool
    };
     drawOnCanvas_local(drawingData, ctx);
    
     socket.emit('drawing_event', drawingData);
     [lastX, lastY] = [e.offsetX, e.offsetY];

}

function drawOnCanvas_local(data ,ctx) {
    ctx.beginPath();
    ctx.lineWidth = data.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';


if (data.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
} else {
    ctx.strokeStyle = data.color;
    ctx.globalCompositeOperation = 'source-over';
}

ctx.moveTo(data.lastX, data.lastY);
ctx.lineTo(data.x, data.y);
ctx.stroke();
}


function stopDrawing(e){
    if (!isDrawing) return;
    isDrawing = false;
    ctx.beginPath();
    socket.emit('end_stroke');
}
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('mousemove', (e) => {
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
    localCtx.arc(x, y, radius, 0, Math.PI * 2);
    localCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    localCtx.lineWidth = 1;
    localCtx.stroke();
    

}
}

