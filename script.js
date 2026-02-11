// --- CONFIG & STATE ---
const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const noBtn = document.getElementById('noBtn');
const yesBtn = document.getElementById('yesBtn');
const music = document.getElementById('bg-music');
const restartBtn = document.getElementById('restartBtn');

const PARTICLE_COUNT = 3500;
const HEART_SIZE = 16;

let width, height;
let particles = [];
let isCelebrated = false;
let time = 0;
let yesScale = 1;
let audioStarted = false;
let heartRainInterval = null;
let mouse = { x: 0, y: 0 };


// ===============================
// MOBILE SAFE AUDIO
// ===============================
function playMusicMobileSafe() {
    if (audioStarted) return;
    audioStarted = true;

    music.pause();
    music.currentTime = 0;
    music.load();
    music.volume = 0;

    music.play().then(() => {
        let fade = setInterval(() => {
            if (music.volume < 1) {
                music.volume += 0.05;
            } else {
                music.volume = 1;
                clearInterval(fade);
            }
        }, 120);
    }).catch(() => {});
}


// --- SETUP ---
window.onload = () => {
    resize();
    initParticles();
    animate();
};

window.addEventListener('resize', resize);

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}


// ===============================
// "NO" BUTTON
// ===============================
const phrases = [
    "No","Are you sure?","Really?","Think again!",
    "Last chance!","Don't break my heart","Pls?",
    "I have snacks!","Look at the other button ->",
    "Error 404: No not found"
];

let phraseIndex = 0;

function moveNoButton() {
    if (isCelebrated) return;

    yesScale += 0.15;
    yesBtn.style.transform = `scale(${yesScale})`;

    phraseIndex = (phraseIndex + 1) % phrases.length;
    noBtn.innerText = phrases[phraseIndex];

    const randomX = Math.random() * window.innerWidth - window.innerWidth / 2;
    const randomY = Math.random() * window.innerHeight - window.innerHeight / 2;

    noBtn.style.position = 'fixed';
    noBtn.style.left = '50%';
    noBtn.style.top = '50%';
    noBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;
}

noBtn.addEventListener('mouseover', moveNoButton);
noBtn.addEventListener('click', moveNoButton);
noBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    moveNoButton();
});


// ===============================
// YES BUTTON
// ===============================
window.acceptProposal = function () {
    if (isCelebrated) return;
    isCelebrated = true;

    playMusicMobileSafe();

    document.getElementById('mainUI').style.opacity = '0';
    document.getElementById('mainUI').style.pointerEvents = 'none';

    const layer = document.getElementById('successScreen');
layer.classList.add('active');

    createHeartRain();

    particles.forEach(p => {
        p.vx = (Math.random() - 0.5) * 15;
        p.vy = (Math.random() - 0.5) * 15;
        p.vz = (Math.random() - 0.5) * 15;
        p.friction = 0.96;
    });
};


// ===============================
// HEART RAIN (Fixed)
// ===============================
function createHeartRain() {
    const container = document.body;
    const heartChars = ['❤️','💖','💕','💗'];

    clearInterval(heartRainInterval);

    heartRainInterval = setInterval(() => {
        const heart = document.createElement('div');
        heart.classList.add('heart-rain');
        heart.innerText = heartChars[Math.floor(Math.random()*heartChars.length)];

        heart.style.left = Math.random()*100 + 'vw';
        heart.style.fontSize = (Math.random()*20+10)+'px';
        heart.style.animationDuration = (Math.random()*2+3)+'s';

        container.appendChild(heart);
        setTimeout(() => heart.remove(), 5000);
    }, 120);
}


// ===============================
// RESTART FUNCTION (Fixed)
// ===============================
restartBtn.addEventListener('click', restartExperience);

function restartExperience() {

    // Stop heart rain
    if (heartRainInterval) {
        clearInterval(heartRainInterval);
        heartRainInterval = null;
    }

    document.querySelectorAll('.heart-rain').forEach(el => el.remove());

    // Reset states
    isCelebrated = false;
    yesScale = 1;
    phraseIndex = 0;

    // Reset buttons
    yesBtn.style.transform = 'scale(1)';
    noBtn.style.position = '';
    noBtn.style.left = '';
    noBtn.style.top = '';
    noBtn.style.transform = '';
    noBtn.innerText = "No";

    // Reset UI layers properly
    successScreen.classList.remove('active');

    mainUI.style.opacity = '1';
    mainUI.style.pointerEvents = 'auto';

    // Reset particles
    initParticles();
    rotX = 0;
    rotY = 0;

    // Reset music
    music.pause();
    music.currentTime = 0;
    audioStarted = false;
}



// ===============================
// PARTICLE SYSTEM
// ===============================
class Particle {
    constructor() {
        this.setHeartPos();
        this.x = this.tx;
        this.y = this.ty;
        this.z = this.tz;
        this.vx = this.vy = this.vz = 0;
        this.size = Math.random()*2;
        this.friction = 0.92;
        this.color = `hsl(${340 + Math.random()*40},100%,${50 + Math.random()*30}%)`;
    }

    setHeartPos() {
        let t = Math.random()*Math.PI*2;
        let u = Math.random();
        let scale = Math.pow(u, 1/3) * HEART_SIZE;

        let x = 16*Math.pow(Math.sin(t),3);
        let y = -(13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t));
        let z = (Math.random()-0.5)*10;

        this.tx = x*scale;
        this.ty = y*scale;
        this.tz = z*scale;
    }

    update(beat) {
        if (isCelebrated) {
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.vz *= this.friction;
            this.size *= 0.99;
        } else {
            let pulse = 1 + beat*0.1;
            this.x += (this.tx*pulse - this.x)*0.1;
            this.y += (this.ty*pulse - this.y)*0.1;
            this.z += (this.tz*pulse - this.z)*0.1;
        }
    }

    draw(ctx, rx, ry) {
        let y1 = this.y*Math.cos(rx) - this.z*Math.sin(rx);
        let z1 = this.z*Math.cos(rx) + this.y*Math.sin(rx);
        let x1 = this.x*Math.cos(ry) - z1*Math.sin(ry);
        let z2 = z1*Math.cos(ry) + this.x*Math.sin(ry);

        let perspective = 500;
        let scale = perspective/(perspective+z2);

        let x2d = width/2 + x1*scale;
        let y2d = height/2 + y1*scale;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x2d,y2d,this.size*scale,0,Math.PI*2);
        ctx.fill();
    }
}

function initParticles(){
    particles=[];
    for(let i=0;i<PARTICLE_COUNT;i++) particles.push(new Particle());
}


// ===============================
// CURSOR PROXIMITY GLOW
// ===============================
document.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    const centerX = width/2;
    const centerY = height/2;

    const dx = mouse.x - centerX;
    const dy = mouse.y - centerY;
    const distance = Math.sqrt(dx*dx + dy*dy);

    if(distance < 200 && !isCelebrated){
        canvas.style.filter = "drop-shadow(0 0 20px #ff4d6d)";
        canvas.style.cursor = "pointer";
    } else {
        canvas.style.filter = "none";
        canvas.style.cursor = "default";
    }
});


// ===============================
// ANIMATION LOOP
// ===============================
let rotX=0, rotY=0;

function animate(){
    requestAnimationFrame(animate);

    ctx.fillStyle='rgba(15,2,5,0.4)';
    ctx.fillRect(0,0,width,height);

    time+=0.02;
    let beat=Math.pow(Math.sin(time*3),60)*0.5;

    rotY+=0.003;

    ctx.globalCompositeOperation='lighter';
    particles.forEach(p=>{
        p.update(beat);
        p.draw(ctx,rotX,rotY);
    });
    ctx.globalCompositeOperation='source-over';
}
