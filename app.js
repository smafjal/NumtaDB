// Bengali digit mappings
const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

// Global variables
let session = null;
let isDrawing = false;

// Canvas setup
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');

// UI elements
const statusContainer = document.getElementById('statusContainer');
const statusText = document.getElementById('statusText');
const errorContainer = document.getElementById('errorContainer');
const errorText = document.getElementById('errorText');
const resultContainer = document.getElementById('resultContainer');
const clearBtn = document.getElementById('clearBtn');
const classifyBtn = document.getElementById('classifyBtn');

// Initialize canvas
function initCanvas() {
    canvas.width = 320;
    canvas.height = 320;
    clearCanvas();
}

// Clear canvas
function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Hide results and errors
    resultContainer.style.display = 'none';
    errorContainer.style.display = 'none';
}

// Update status
function updateStatus(message, state) {
    statusText.textContent = message;
    statusContainer.className = `status-container ${state}`;
}

// Show error
function showError(message) {
    errorText.textContent = `❌ ${message}`;
    errorContainer.style.display = 'block';
}

// Hide error
function hideError() {
    errorContainer.style.display = 'none';
}

// Get coordinates with proper scaling
function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    
    // Get the mouse/touch position relative to the canvas
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale to canvas internal coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: x * scaleX,
        y: y * scaleY
    };
}

// Start drawing
function startDrawing(e) {
    isDrawing = true;
    const coords = getCoordinates(e);
    
    // Set drawing style - narrower line for better precision
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
}

// Draw
function draw(e) {
    if (!isDrawing) return;
    
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
}

// Stop drawing
function stopDrawing() {
    isDrawing = false;
}

// Mouse events
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

// Touch events for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const syntheticEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY
    };
    startDrawing(syntheticEvent);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const syntheticEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY
    };
    draw(syntheticEvent);
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopDrawing();
});

// Clear button
clearBtn.addEventListener('click', clearCanvas);

// Classify button
classifyBtn.addEventListener('click', classifyDigit);

// Preprocess image for model
function preprocessImage() {
    // Get image data from canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Resize to 224x224 if canvas is different size
    let processedCanvas = canvas;
    let processedCtx = ctx;
    
    if (canvas.width !== 224 || canvas.height !== 224) {
        processedCanvas = document.createElement('canvas');
        processedCanvas.width = 224;
        processedCanvas.height = 224;
        processedCtx = processedCanvas.getContext('2d');
        processedCtx.drawImage(canvas, 0, 0, 224, 224);
    }
    
    const processedImageData = processedCtx.getImageData(0, 0, 224, 224);
    const pixels = processedImageData.data;
    
    // Create tensor with shape [1, 3, 224, 224]
    const red = [];
    const green = [];
    const blue = [];
    
    // ImageNet normalization values
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];
    
    for (let i = 0; i < pixels.length; i += 4) {
        // Normalize to [0, 1] and apply ImageNet normalization
        red.push((pixels[i] / 255.0 - mean[0]) / std[0]);
        green.push((pixels[i + 1] / 255.0 - mean[1]) / std[1]);
        blue.push((pixels[i + 2] / 255.0 - mean[2]) / std[2]);
    }
    
    // Combine channels: [R, G, B]
    const transposedData = red.concat(green).concat(blue);
    
    // Create tensor
    const tensor = new ort.Tensor('float32', Float32Array.from(transposedData), [1, 3, 224, 224]);
    return tensor;
}

// Softmax function
function softmax(arr) {
    const max = Math.max(...arr);
    const exps = arr.map(x => Math.exp(x - max));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    return exps.map(x => x / sumExps);
}

// Classify digit
async function classifyDigit() {
    if (!session) {
        showError('Model not loaded yet! Please wait...');
        return;
    }
    
    hideError();
    updateStatus('Classifying...', 'loading');
    classifyBtn.disabled = true;
    
    try {
        // Preprocess image
        const inputTensor = preprocessImage();
        
        // Run inference
        const feeds = { input: inputTensor };
        const results = await session.run(feeds);
        
        // Get output
        const output = results.output.data;
        
        // Apply softmax to get probabilities
        const probabilities = softmax(Array.from(output));
        
        // Get prediction
        const predictedClass = probabilities.indexOf(Math.max(...probabilities));
        const confidence = probabilities[predictedClass];
        
        // Display results
        displayResults(predictedClass, confidence, probabilities);
        
        updateStatus('Model ready!', 'ready');
    } catch (error) {
        console.error('Prediction error:', error);
        showError(`Failed to classify digit: ${error.message}`);
        updateStatus('Model ready!', 'ready');
    } finally {
        classifyBtn.disabled = false;
    }
}

// Display results
function displayResults(predictedClass, confidence, probabilities) {
    // Show result container
    resultContainer.style.display = 'block';
    
    // Update main prediction
    document.getElementById('predictedDigit').textContent = BENGALI_DIGITS[predictedClass];
    document.getElementById('confidenceText').textContent = 
        `Confidence: ${(confidence * 100).toFixed(2)}%`;
    
    // Create probability entries with Bengali digits and numeric labels
    const probEntries = probabilities.map((prob, idx) => ({
        digit: idx,
        bengaliDigit: BENGALI_DIGITS[idx],
        probability: prob
    }));
    
    // Sort by probability (highest first)
    probEntries.sort((a, b) => b.probability - a.probability);
    
    // Update probabilities grid
    const grid = document.getElementById('probabilitiesGrid');
    grid.innerHTML = '';
    
    probEntries.forEach(entry => {
        const probItem = document.createElement('div');
        probItem.className = 'prob-item';
        
        const digitSpan = document.createElement('span');
        digitSpan.className = 'prob-digit';
        digitSpan.textContent = entry.bengaliDigit;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'prob-bar-container';
        
        const bar = document.createElement('div');
        bar.className = 'prob-bar';
        bar.style.width = `${entry.probability * 100}%`;
        
        barContainer.appendChild(bar);
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'prob-value';
        valueSpan.textContent = `${(entry.probability * 100).toFixed(1)}%`;
        
        probItem.appendChild(digitSpan);
        probItem.appendChild(barContainer);
        probItem.appendChild(valueSpan);
        
        grid.appendChild(probItem);
    });
    
    // Scroll to results
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Load ONNX model
async function loadModel() {
    try {
        updateStatus('Loading model...', 'loading');
        
        // Create session with ONNX Runtime
        session = await ort.InferenceSession.create('model.onnx', {
            executionProviders: ['wasm'],
        });
        
        updateStatus('Model ready! Start drawing...', 'ready');
        console.log('✓ Model loaded successfully');
    } catch (error) {
        updateStatus(`Error: ${error.message}`, 'error');
        showError(`Failed to load model. Make sure model.onnx exists in the frontend folder.`);
        console.error('Error loading model:', error);
    }
}

// Side Menu functionality
const menuButton = document.getElementById('menuButton');
const closeMenu = document.getElementById('closeMenu');
const sideMenu = document.getElementById('sideMenu');
const menuOverlay = document.getElementById('menuOverlay');

function openMenu() {
    sideMenu.classList.add('active');
    menuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeMenuFunc() {
    sideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

menuButton.addEventListener('click', openMenu);
closeMenu.addEventListener('click', closeMenuFunc);
menuOverlay.addEventListener('click', closeMenuFunc);

// Close menu on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sideMenu.classList.contains('active')) {
        closeMenuFunc();
    }
});

// Initialize
initCanvas();
loadModel();
