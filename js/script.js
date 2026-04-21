// Audio Engine
let audioContext = null;
let oscillator = null;
let gainNode = null;
let running = false;
let currentModeObj = null;
let startTime = 0;
let animId = null;

const definitions = [
    { min: 18000, max: 22000, name: 'Rodent Protocol' },
    { min: 14000, max: 19000, name: 'Insect Protocol' },
    { min: 19000, max: 21000, name: 'Aviation Protocol' },
    { min: 12000, max: 22000, name: 'Omni-Sweep' }
];

// Build visualizer bars
const buildVisualizer = () => {
    const viz = document.getElementById('vizContainer');
    if (!viz) return;
    viz.innerHTML = ''; // Clear existing
    for(let i=0; i<40; i++) {
        const d = document.createElement('div');
        d.className = 'viz-bar';
        viz.appendChild(d);
    }
};

function selectMode(idx, el) {
    if(running) return;
    currentModeObj = definitions[idx];
    
    document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    
    document.getElementById('mainButton').disabled = false;
    document.getElementById('algTag').textContent = `ALGORITMO: ${currentModeObj.name.toUpperCase()}`;
    document.getElementById('freqNum').textContent = (currentModeObj.min / 1000).toFixed(1);
}

function startEngine() {
    const mainBtn = document.getElementById('mainButton');
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    updateFreq();
    
    gainNode.gain.value = document.getElementById('volRange').value / 100;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    running = true;
    startTime = Date.now();
    
    // UI Updates
    mainBtn.innerHTML = 'STOP EMISSION';
    mainBtn.classList.add('active');
    document.getElementById('statusBadge').classList.add('active');
    document.getElementById('statusText').textContent = 'ACTIVE EMISSION';
    document.getElementById('effVal').textContent = 'OPTIMAL';
    
    requestAnimationFrame(loop);
}

function stopEngine() {
    const mainBtn = document.getElementById('mainButton');
    if(oscillator) {
        oscillator.stop();
        oscillator.disconnect();
    }
    if(audioContext) audioContext.close();
    
    running = false;
    mainBtn.innerHTML = 'START EMISSION';
    mainBtn.classList.remove('active');
    document.getElementById('statusBadge').classList.remove('active');
    document.getElementById('statusText').textContent = 'OFF-LINE';
    document.getElementById('freqNum').textContent = (currentModeObj.min / 1000).toFixed(1);
    document.getElementById('effVal').textContent = 'STBY';
    
    // Reset bars
    document.querySelectorAll('.viz-bar').forEach(b => {
        b.style.height = '8px';
        b.style.opacity = '0.15';
    });
}

function updateFreq() {
    if(!running || !currentModeObj) return;
    
    const now = Date.now();
    const elapsed = (now - startTime) / 1000;
    
    // Complex frequency modulation to prevent habituation
    const base = currentModeObj.min;
    const range = currentModeObj.max - currentModeObj.min;
    
    // Combination of sine waves for irregular pattern
    const modulation = (Math.sin(elapsed * 1.5) + Math.sin(elapsed * 0.7) + 2) / 4;
    const freq = base + (modulation * range);
    
    oscillator.frequency.setTargetAtTime(freq, audioContext.currentTime, 0.1);
    
    // Numeric UI
    document.getElementById('freqNum').textContent = (freq / 1000).toFixed(1);
    
    // Clock
    const m = Math.floor(elapsed / 60);
    const s = Math.floor(elapsed % 60);
    document.getElementById('timeVal').textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function loop() {
    if(!running) return;
    
    updateFreq();
    
    // Visualizer animation
    const bars = document.querySelectorAll('.viz-bar');
    bars.forEach((bar, i) => {
        const h = 8 + Math.random() * 40;
        bar.style.height = h + 'px';
        bar.style.opacity = 0.1 + (h/50);
    });
    
    requestAnimationFrame(loop);
}

// initialization
document.addEventListener('DOMContentLoaded', () => {
    buildVisualizer();
    initTunnel();

    const mainBtn = document.getElementById('mainButton');
    const volRange = document.getElementById('volRange');
    const volVal = document.getElementById('volVal');

    if (mainBtn) {
        mainBtn.onclick = () => {
            if(!running) startEngine();
            else stopEngine();
        };
    }

    if (volRange) {
        volRange.oninput = function() {
            const v = this.value;
            volVal.textContent = v + '%';
            if(gainNode) gainNode.gain.setTargetAtTime(v / 100, audioContext.currentTime, 0.05);
        };
    }
});

// --- Futuristic Tunnel Background ---
function initTunnel() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width, height, centerX, centerY;
    let frames = [];
    const frameCount = 15;
    const speedBase = 0.015;
    let speed = speedBase;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        centerX = width / 2;
        centerY = height / 2;
    }

    window.addEventListener('resize', resize);
    resize();

    // Create initial frames at different depths
    for (let i = 0; i < frameCount; i++) {
        frames.push({ z: (i / frameCount) });
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        
        // Dynamic speed based on app state
        const targetSpeed = running ? 0.05 : speedBase;
        speed += (targetSpeed - speed) * 0.05;

        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 1;

        frames.forEach(frame => {
            frame.z -= speed;
            if (frame.z <= 0) frame.z = 1;

            const size = 1 / frame.z;
            const w = 400 * size;
            const h = 400 * size;
            const x = centerX - w / 2;
            const y = centerY - h / 2;

            // Draw rect frame
            ctx.globalAlpha = Math.min(1, (1 - frame.z) * 0.8);
            ctx.strokeRect(x, y, w, h);

            // Draw lines to corners (perspective)
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x + w, y);
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y + h);
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x + w, y + h);
            ctx.stroke();
        });

        requestAnimationFrame(draw);
    }

    draw();
}
