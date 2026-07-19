const API_URL = 'http://localhost:3000/api';
let isRegistering = false;

function showError(msg) {
  const el = document.getElementById('errorMsg');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 5000);
  }
}

function showSuccess(msg) {
  const el = document.getElementById('successMsg');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function toggleMode() {
  isRegistering = !isRegistering;
  const formTitle = document.getElementById('formTitle');
  const formSubtitle = document.getElementById('formSubtitle');
  const submitBtn = document.getElementById('submitBtn');
  const registerFields = document.getElementById('registerFields');
  const toggleText = document.getElementById('toggleText');

  if (formTitle) formTitle.textContent = isRegistering ? 'สร้างบัญชี' : 'ยินดีต้อนรับกลับมา';
  if (formSubtitle) formSubtitle.textContent = isRegistering ? 'ตั้งค่าโปรไฟล์สตรีมเมอร์ของคุณ' : 'เข้าสู่ระบบเพื่อจัดการแดชบอร์ด';
  if (submitBtn) submitBtn.textContent = isRegistering ? 'สร้างบัญชี' : 'เข้าสู่ระบบ';
  if (registerFields) registerFields.style.display = isRegistering ? 'block' : 'none';

  const emailLabel = document.getElementById('emailLabel');
  const emailInput = document.getElementById('email');
  if (emailLabel) emailLabel.textContent = isRegistering ? 'อีเมล' : 'อีเมลหรือชื่อผู้ใช้';
  if (emailInput) {
    emailInput.placeholder = isRegistering ? 'you@example.com' : 'you@example.com หรือ admin';
    emailInput.type = isRegistering ? 'email' : 'text';
  }

  if (toggleText) {
    toggleText.innerHTML = isRegistering
      ? 'มีบัญชีอยู่แล้ว? <a href="#" onclick="toggleMode(); return false;">เข้าสู่ระบบ</a>'
      : 'ยังไม่มีบัญชี? <a href="#" onclick="toggleMode(); return false;">สมัครสมาชิก</a>';
  }
}

document.querySelectorAll('.otp-input').forEach((input, i, all) => {
  input.addEventListener('input', (e) => {
    if (e.target.value && i < all.length - 1) all[i + 1].focus();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && i > 0) all[i - 1].focus();
  });
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text').trim();
    if (paste.length === 6) {
      all.forEach((inp, idx) => inp.value = paste[idx] || '');
      all[5].focus();
    }
  });
});

function getOtpValue() {
  return Array.from(document.querySelectorAll('.otp-input')).map(i => i.value).join('');
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (isRegistering) {
      const username = document.getElementById('username').value;
      if (!username) return showError('กรุณากรอกชื่อผู้ใช้');

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return showError('กรุณากรอกอีเมลที่ถูกต้อง');

      try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username })
        });
        const data = await res.json();
        if (res.ok) {
          showSuccess('รหัสยืนยันถูกส่งแล้ว! กรุณาตรวจสอบอีเมลของคุณ');
          document.getElementById('loginForm').style.display = 'none';
          document.getElementById('otpForm').style.display = 'block';
          document.getElementById('toggleText').style.display = 'none';
        } else {
          showError(data.error);
        }
      } catch {
        showError('\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e40\u0e0a\u0e37\u0e48\u0e2d\u0e21\u0e15\u0e48\u0e2d\u0e40\u0e0b\u0e34\u0e23\u0e4c\u0e1f\u0e40\u0e27\u0e2d\u0e23\u0e4c\u0e44\u0e14\u0e49');
      }
    } else {
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = '/dashboard.html';
        } else {
          showError(data.error);
        }
      } catch {
        showError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      }
    }
  });
}

const otpForm = document.getElementById('otpForm');
if (otpForm) {
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const otp = getOtpValue();
    if (otp.length !== 6) return showError('กรุณากรอกรหัสให้ครบ 6 หลัก');
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard.html';
      } else {
        showError(data.error);
      }
    } catch {
      showError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  });
}
