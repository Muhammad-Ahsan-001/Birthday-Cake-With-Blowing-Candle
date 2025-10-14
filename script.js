const startBtn = document.getElementById('startBtn');
const message = document.getElementById('message');
const flames = document.querySelectorAll('.flame');
const audio = document.getElementById('happyAudio');
const tempMsg = document.getElementById('tempMsg');

let listening = false;
let audioCtx, analyser, dataArray, sourceNode;
let lastBlowTime = 0;
let candlesblown=0;

let blowCount = 0; // to track how many times user has blown

startBtn.addEventListener('click', async () => {
  if (listening) return;
  try {
    // light candles
    flames.forEach(item => {
      item.style.background = 'radial-gradient(circle at 30% 30%,#ffe28a 0,#ffb84d 50%,#ff6f3c 100%)';
      item.style.transform = 'translateX(-50%)';
      item.style.boxShadow = '0 6px 12px rgba(255,120,30,0.25)';
      item.classList.remove('out');
    });

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
  const THRESHOLD = 0.3;

  if (rms > THRESHOLD && (Date.now() - lastBlowTime > 1200)) {
    lastBlowTime = Date.now();
    blowCount++;

    if (blowCount === 1) {
      showTempMessage('nahhh blow stronger 😤');
    } else if (blowCount === 2) {
      showTempMessage('almost there 💨');
    } else if (blowCount >= 3) {
      onBlowDetected();
    }
  }

  window.requestAnimationFrame(checkBlow);
}

function onBlowDetected() {
  message.textContent = 'Nice! Candles blown 🎉';
  startBtn.textContent = 'Blow again for more confetti!!';
  extinguishCandles();
  launchConfetti();
  playHappyAudio();
  // blowCount = 0; // reset so user can play again
}

function extinguishCandles() {
  flames.forEach(f => {
    f.classList.add('out');
    f.style.opacity = '0';
  });
}

function launchConfetti() {
  if (window.confetti) {
    confetti({
      particleCount: 140,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function playHappyAudio() {
  if (!audio) return;
  audio.play().catch(() => {
    message.textContent = 'Tap Play to hear the song';
    addManualPlay();
  });
}

function addManualPlay() {
  if (document.getElementById('playManual')) return;
  const btn = document.createElement('button');
  btn.id = 'playManual';
  btn.className = 'btn';
  btn.textContent = 'Play song';
  btn.style.marginTop = '12px';
  btn.onclick = () => {
    audio.play();
    btn.remove();
  };
  document.querySelector('.card').appendChild(btn);
}

function showTempMessage(msg) {
  tempMsg.textContent = msg;
  tempMsg.classList.add('show');

  setTimeout(() => {
    tempMsg.classList.remove('show');
  }, 2500);
}
