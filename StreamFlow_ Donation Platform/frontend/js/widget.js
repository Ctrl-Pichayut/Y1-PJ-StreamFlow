const socket = io({ transports: ['websocket', 'polling'] });
const params = new URLSearchParams(window.location.search);
const username = params.get('u');

socket.on('connect', () => {
  if (username) {
    socket.emit('join-room', username);
  } else {
    console.error('[StreamFlow Widget] Missing ?u=username in URL');
  }
});

const container = document.getElementById('alert-container');
const alertDonor = document.getElementById('alert-donor');
const alertAmount = document.getElementById('alert-amount');
const alertMsg = document.getElementById('alert-message');

let queue = [];
let isPlaying = false;
const alertSound = new Audio('/sound/Alert-Sound.MP3');
alertSound.volume = 0.5;

socket.on('donation', (data) => {
  queue.push(data);
  if (!isPlaying) playNext();
});

function formatMoney(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function playNext() {
  if (!queue.length) { isPlaying = false; return; }
  isPlaying = true;
  const d = queue.shift();

  if (alertDonor) alertDonor.textContent = d.donor_name || 'Anonymous';
  if (alertAmount) alertAmount.textContent = `฿${formatMoney(d.amount)}`;
  if (alertMsg) alertMsg.textContent = d.message || '';

  if (container) {
    alertSound.currentTime = 0;
    alertSound.play().catch(e => console.error('[StreamFlow Widget] Audio play failed:', e));

    container.className = '';
    container.style.display = 'block';

    void container.offsetWidth;

    container.classList.add('animate-in');

    setTimeout(() => {
      container.classList.remove('animate-in');
      container.classList.add('animate-out');

      setTimeout(() => {
        container.style.display = 'none';
        container.classList.remove('animate-out');
        playNext();
      }, 1000);
    }, 5000);
  } else {
    isPlaying = false;
    playNext();
  }
}
