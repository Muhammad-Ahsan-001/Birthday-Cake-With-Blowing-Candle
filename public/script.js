// script.js (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBH13dVREk4nb-jRXhnd--xVHeZ4yUVFsI",
  authDomain: "bd-wishes-efd0d.firebaseapp.com",
  databaseURL: "https://bd-wishes-efd0d-default-rtdb.firebaseio.com",
  projectId: "bd-wishes-efd0d",
  storageBucket: "bd-wishes-efd0d.firebasestorage.app",
  messagingSenderId: "180185640583",
  appId: "1:180185640583:web:a5fe55a5997269d5d5d222",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const startBtn = document.getElementById('startBtn');
const message = document.getElementById('message');
const flames = document.querySelectorAll('.flame');
const audio = document.getElementById('happyAudio');
const tempMsgEl = document.getElementById('tempMsg');
const subtitleEl = document.getElementById('subtitle');
const wishListEl = document.getElementById("wishList");


let listening = false;
let audioCtx, analyser, dataArray, sourceNode;
let lastBlowTime = 0;
let blowCount = 0;

// ---------- Candle & blow functions ----------
function showTempMessage(msg) {
  tempMsgEl.textContent = msg;
  tempMsgEl.classList.add('show');
  setTimeout(() => tempMsgEl.classList.remove('show'), 2500);
}

startBtn.addEventListener('click', async () => {
  if (listening) return;
  flames.forEach(item => {
    item.style.background = 'radial-gradient(circle at 30% 30%,#ffe28a 0,#ffb84d 50%,#ff6f3c 100%)';
    item.style.transform = 'translateX(-50%)';
    item.style.boxShadow = '0 6px 12px rgba(255,120,30,0.25)';
    item.classList.remove('out');
    item.style.opacity = '1';
  });

  try {
    await initMic();
    startBtn.textContent = 'Listening... Blow to extinguish!';
    message.textContent = 'Blow into your mic now!';
  } catch (err) {
    message.textContent = 'Mic access failed. Check permissions.';
    console.error(err);
  }
});

async function initMic() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  sourceNode = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  sourceNode.connect(analyser);
  dataArray = new Uint8Array(analyser.fftSize);
  listening = true;
  window.requestAnimationFrame(checkBlow);
}

function computeRMS(buf) {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = (buf[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / buf.length);
}

function checkBlow() {
  analyser.getByteTimeDomainData(dataArray);
  const rms = computeRMS(dataArray);
  const THRESHOLD = 0.17;

  if (rms > THRESHOLD && (Date.now() - lastBlowTime > 900)) {
    lastBlowTime = Date.now();
    blowCount++;

    if (blowCount === 1) showTempMessage('nahhh blow stronger 😤');
    else if (blowCount === 2) showTempMessage('almost there 💨');
    else if (blowCount >= 3) {
      onBlowDetected();
    }
  }
  window.requestAnimationFrame(checkBlow);
}

function onBlowDetected() {
  message.textContent = 'Nice! Candles blown 🎉';
  startBtn.textContent = 'WELLDONE!';
  extinguishCandles();
  launchConfetti();
  playHappyAudio();
}

function extinguishCandles() {
  flames.forEach(f => {
    f.classList.add('out');
    f.style.opacity = '0';
  });
}

function launchConfetti() {
  if (window.confetti) confetti({ particleCount: 140, spread: 70, origin: { y: 0.6 }});
}

function playHappyAudio() {
  if (!audio) return;
  audio.play().catch(() => { message.textContent = 'Tap Play to hear the song'; });
}

// ---------- Live wishes ----------
const wishesRef = ref(db, "birthdayMessages");

onValue(wishesRef, (snapshot) => {
  wishListEl.innerHTML = "";
  const data = snapshot.val();
  if (data) {
    const sorted = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
    sorted.forEach(item => {
      const div = document.createElement('div');
      div.className = 'wishCard';
      div.innerHTML = `${item.wish} <br><span>- ${item.from}</span>`;
      wishListEl.appendChild(div);
    });
  }
});
