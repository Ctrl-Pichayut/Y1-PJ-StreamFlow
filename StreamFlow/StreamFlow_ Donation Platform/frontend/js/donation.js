const API_URL = 'http://localhost:3000/api';
const params = new URLSearchParams(window.location.search);
const username = params.get('u') || 'testuser';
let streamerId = null;

function showToast(message, type = 'error') {
  const toast = document.getElementById('toastNotification');
  const msg = document.getElementById('toastMessage');
  msg.textContent = message;
  toast.className = 'toast-notification show ' + type;
  setTimeout(() => { toast.classList.remove('show'); }, 4000);
}

async function loadProfile() {
  try {
    const res = await fetch(`${API_URL}/users/profile/${username}`);
    if (!res.ok) throw new Error('User not found');
    const user = await res.json();
    streamerId = user.id;
    document.getElementById('streamerName').textContent = user.display_name || user.username;
    document.getElementById('profileAvatar').src = user.avatar
      ? `http://localhost:3000${user.avatar}`
      : `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.username)}&backgroundColor=6d28d9`;

    const isEnabled = user.payment_info?.promptpay?.enabled;

    if (isEnabled && user.payment_info?.promptpay?.value) {
      document.getElementById('accountNo').textContent = user.payment_info.promptpay.value;
    } else {
      document.getElementById('accountNo').textContent = '—';
    }
  } catch {
    document.getElementById('streamerName').textContent = 'ไม่พบผู้ใช้';
  }
}

const dropZone = document.getElementById('dropZone');
const slipInput = document.getElementById('slipFile');

if (dropZone) {
  ['dragenter', 'dragover'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.add('dragging'); });
  });
  ['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.remove('dragging'); });
  });
  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length) { slipInput.files = files; showPreview(files[0]); }
  });
}

if (slipInput) {
  slipInput.addEventListener('change', (e) => {
    if (e.target.files[0]) showPreview(e.target.files[0]);
  });
}

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const preview = document.getElementById('slipPreview');
    preview.src = ev.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

const donationForm = document.getElementById('donationForm');
if (donationForm) {
  donationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!streamerId) return showToast('สตรีมเมอร์ไม่ถูกต้อง');

    const btn = document.getElementById('submitBtn');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    const formData = new FormData();
    formData.append('user_id', streamerId);
    const donorNameVal = document.getElementById('donorName').value.trim();
    formData.append('donor_name', donorNameVal ? donorNameVal : 'ไม่ระบุชื่อ');
    formData.append('message', document.getElementById('message').value);
    formData.append('amount', 0);
    formData.append('slip', slipInput.files[0]);

    try {
      const res = await fetch(`${API_URL}/donations`, { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok) {
        document.getElementById('successOverlay').classList.add('show');
        document.getElementById('verifyBadge').style.display = 'block';
        document.getElementById('successMessage').textContent = 'สลิปของคุณผ่านการตรวจสอบแล้ว! แจ้งเตือนถูกส่งไปยังสตรีมเมอร์';
        donationForm.reset();
        document.getElementById('slipPreview').style.display = 'none';
        launchConfetti();
      } else {
        showToast(data.message || 'เกิดข้อผิดพลาดในการส่งโดเนท');
      }
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
    } finally {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
    }
  });
}

function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  const colors = ['#7c3aed', '#06b6d4', '#ec4899', '#22c55e', '#eab308', '#fafafa'];

  for (let i = 0; i < 120; i++) {
    pieces.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -14 - 4,
      w: Math.random() * 8 + 4,
      h: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      gravity: 0.15 + Math.random() * 0.1
    });
  }

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx;
      p.vy += p.gravity;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame / 100);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < 120) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

loadProfile();
