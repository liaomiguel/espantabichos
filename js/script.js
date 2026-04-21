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
    initSoundWaves();

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

// --- Ultrasonic Wave Background ---
function initSoundWaves() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width, height, centerX, centerY;
    let waves = [];
    const maxWaves = 12;
    let time = 0;

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

    // Create initial wave objects
    for (let i = 0; i < maxWaves; i++) {
        waves.push({
            radius: (i / maxWaves) * Math.max(width, height) * 0.7,
            opacity: 1 - (i / maxWaves),
            speed: 1.5 + Math.random()
        });
    }

    function draw() {
        ctx.fillStyle = 'rgba(5, 10, 15, 0.2)'; 
        ctx.fillRect(0, 0, width, height);
        
        time += running ? 0.04 : 0.015;
        
        const primaryColor = '#00f2ff';
        const secondaryColor = '#7000ff';

        // Background Grid (Technical look)
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.04)';
        ctx.lineWidth = 0.5;
        const gridSize = 60;
        for(let x = 0; x < width; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for(let y = 0; y < height; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        waves.forEach((wave, i) => {
            const currentSpeed = running ? wave.speed * 3 : wave.speed;
            wave.radius += currentSpeed;
            
            const maxRadius = Math.max(width, height) * 0.8;
            if (wave.radius > maxRadius) {
                wave.radius = 0;
            }

            const alpha = (1 - (wave.radius / maxRadius)) * 0.5;
            
            // Draw Main Circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, wave.radius, 0, Math.PI * 2);
            ctx.strokeStyle = running ? primaryColor : 'rgba(0, 242, 255, 0.4)';
            ctx.globalAlpha = alpha;
            ctx.lineWidth = running ? 2 : 1;
            ctx.stroke();

            // Data markers on the wave
            if (i % 4 === 0 && wave.radius > 50) {
                ctx.font = '700 8px Geist';
                ctx.fillStyle = primaryColor;
                ctx.fillText(`${(wave.radius/10).toFixed(1)}kHz`, centerX + wave.radius + 5, centerY);
                
                ctx.beginPath();
                ctx.moveTo(centerX + wave.radius, centerY);
                ctx.lineTo(centerX + wave.radius + 15, centerY);
                ctx.stroke();
            }

            // High-frequency interference (for active state)
            if (running) {
                ctx.beginPath();
                const segments = 120;
                for(let s = 0; s <= segments; s++) {
                    const angle = (s / segments) * Math.PI * 2;
                    const noise = Math.sin(angle * 20 + time * 10) * 3;
                    const r = wave.radius + noise;
                    const px = centerX + Math.cos(angle) * r;
                    const py = centerY + Math.sin(angle) * r;
                    if(s === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.strokeStyle = secondaryColor;
                ctx.lineWidth = 0.5;
                ctx.globalAlpha = alpha * 0.3;
                ctx.stroke();
            }
        });

        // Ultrasonic Scanning Sweep (Radar style)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(time);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height));
        grad.addColorStop(0, 'rgba(0, 242, 255, 0)');
        grad.addColorStop(0.5, 'rgba(0, 242, 255, 0.05)');
        grad.addColorStop(1, 'rgba(0, 242, 255, 0.1)');
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, Math.max(width, height), 0, Math.PI / 8);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        // Horizontal Scanline
        const scanY = (Math.sin(time * 0.3) * 0.5 + 0.5) * height;
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, scanY, width, 1);
        
        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }

    draw();
}
