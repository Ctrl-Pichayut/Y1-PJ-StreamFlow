const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');
if (!token) window.location.href = '/';

const user = JSON.parse(localStorage.getItem('user'));
document.getElementById('userEmail').textContent = user?.username || '';
const BASE_URL = API_URL.replace('/api', '');
document.getElementById('widgetUrl').value = `${BASE_URL}/widget.html?u=${user?.username}`;
document.getElementById('donateUrl').value = `${window.location.origin}/donation.html?u=${user?.username}`;

function switchTab(tabId, linkEl) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-tab'));
  document.querySelectorAll('.top-bar-link').forEach(el => el.classList.remove('active'));

  const tabEl = document.getElementById(`${tabId}-tab`);
  if (tabEl) tabEl.classList.add('active-tab');

  if (!linkEl) {
    linkEl = document.querySelector(`.top-bar-link[onclick*="'${tabId}'"]`);
  }
  if (linkEl) linkEl.classList.add('active');

  localStorage.setItem('activeTab', tabId);
}

function showToast(message, isError = false, duration = 2000) {
  const toast = document.getElementById('copyToast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.backgroundColor = isError ? '#ef4444' : '';
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.textContent = '✓ คัดลอกแล้ว';
      toast.style.backgroundColor = '';
    }, 300);
  }, duration);
}

function copyUrl(inputId) {
  const val = document.getElementById(inputId).value;
  navigator.clipboard.writeText(val);
  showToast('✓ คัดลอกแล้ว');
}

async function updateUser(payload) {
  return fetch(`${API_URL}/users/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

let allDonations = [];
let filteredDonations = [];
let currentPage = 1;
const itemsPerPage = 6;

async function loadDonations() {
  try {
    const res = await fetch(`${API_URL}/donations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    allDonations = json.data || [];
    filteredDonations = [...allDonations];

    let totalAmount = 0;
    allDonations.forEach(d => {
      totalAmount += parseFloat(d.amount);
    });

    document.getElementById('statTotal').textContent = `฿${totalAmount.toLocaleString()}`;

    renderPage(1);

  } catch (err) {
    console.error('Failed to load donations', err);
  }
}

function filterDonations() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  filteredDonations = allDonations.filter(d => {
    return (d.donor_name && d.donor_name.toLowerCase().includes(query)) ||
      (d.message && d.message.toLowerCase().includes(query));
  });
  renderPage(1);
}

function renderPage(page) {
  currentPage = page;
  const feed = document.getElementById('donationFeed');
  const emptyState = document.getElementById('emptyState');
  const paginationControls = document.getElementById('paginationControls');

  document.getElementById('feedCount').textContent = `${filteredDonations.length} รายการ`;

  feed.innerHTML = '';

  if (!filteredDonations.length) {
    feed.appendChild(emptyState);
    emptyState.style.display = 'flex';
    if (paginationControls) {
      paginationControls.style.display = 'flex';
      document.getElementById('pageIndicator').textContent = `หน้า 1 จาก 1`;
      document.getElementById('prevPageBtn').disabled = true;
      document.getElementById('nextPageBtn').disabled = true;
    }
    return;
  }

  emptyState.style.display = 'none';
  feed.appendChild(emptyState);

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = filteredDonations.slice(startIndex, endIndex);

  pageData.forEach(d => {
    let msg = d.message || '—';
    if (msg.length > 100) msg = msg.substring(0, 100) + '...';

    const card = document.createElement('div');
    card.className = 'donation-card';

    const dcBody = document.createElement('div');
    dcBody.className = 'dc-body';

    const dcTop = document.createElement('div');
    dcTop.className = 'dc-top';

    const dcName = document.createElement('span');
    dcName.className = 'dc-name';
    dcName.textContent = d.donor_name;

    const dcAmount = document.createElement('span');
    dcAmount.className = 'dc-amount';
    dcAmount.textContent = `฿${parseFloat(d.amount).toLocaleString()}`;

    dcTop.appendChild(dcName);
    dcTop.appendChild(dcAmount);

    const dcMessage = document.createElement('div');
    dcMessage.className = 'dc-message';
    dcMessage.textContent = msg;

    dcBody.appendChild(dcTop);
    dcBody.appendChild(dcMessage);
    card.appendChild(dcBody);

    feed.insertBefore(card, emptyState);
  });

  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);

  if (paginationControls) {
    paginationControls.style.display = 'flex';
    const displayPages = Math.max(1, totalPages);
    document.getElementById('pageIndicator').textContent = `หน้า ${currentPage} จาก ${displayPages}`;
    document.getElementById('prevPageBtn').disabled = currentPage <= 1;
    document.getElementById('nextPageBtn').disabled = currentPage >= totalPages;
  }

  feed.scrollTop = 0;
}

window.prevPage = function () {
  if (currentPage > 1) renderPage(currentPage - 1);
};

window.nextPage = function () {
  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
  if (currentPage < totalPages) renderPage(currentPage + 1);
};


function togglePaymentEdit(id) {
  const section = document.getElementById(id);
  const icon = document.getElementById(`${id}-icon`);
  section.classList.toggle('show');
  icon.textContent = section.classList.contains('show') ? '︿' : '∨';
}

async function savePromptPay() {
  const type = 'phone';
  const value = document.getElementById('promptpayValue').value;
  const enabled = document.getElementById('promptpayToggle').checked;

  if (value && value.replace(/\D/g, '').length !== 10) {
    showToast('✕ กรุณากรอกเบอร์โทรให้ครบ 10 หลัก', true, 3000);
    return;
  }

  const payload = {
    payment_info: {
      ...currentUserData.payment_info,
      promptpay: { enabled, type, value }
    }
  };

  payload.phone = value;

  const res = await updateUser(payload);

  if (res.ok) {
    loadSettings();
    showToast('✓ บันทึกพร้อมเพย์และโปรไฟล์แล้ว');
  }
}

document.getElementById('promptpayToggle').addEventListener('change', async (e) => {
  const enabled = e.target.checked;
  const type = 'phone';
  const value = document.getElementById('promptpayValue').value;
  const ppStatusEl = document.getElementById('ppStatus');

  if (ppStatusEl) {
    if (enabled) {
      ppStatusEl.textContent = '● เปิดใช้งาน';
      ppStatusEl.style.color = 'var(--accent-primary)';
    } else {
      ppStatusEl.textContent = '○ ปิดใช้งาน';
      ppStatusEl.style.color = 'var(--text-secondary)';
    }
  }

  const payload = {
    payment_info: {
      ...currentUserData.payment_info,
      promptpay: { enabled, type, value }
    }
  };

  const res = await updateUser(payload);

  if (res.ok) {
    currentUserData.payment_info = payload.payment_info;
    showToast(enabled ? '✓ เปิดใช้งานพร้อมเพย์แล้ว' : '✓ ปิดใช้งานพร้อมเพย์แล้ว');
  }
});

function openEditModal() {
  const modal = document.getElementById('editModal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 10);

  document.getElementById('editDisplayName').value = currentUserData.display_name || currentUserData.username;
  document.getElementById('editEmail').value = currentUserData.email;
  let avatarUrl = '/default-avatar.png';
  if (currentUserData.avatar) {
    avatarUrl = currentUserData.avatar.startsWith('http') ? currentUserData.avatar : `http://localhost:3000${currentUserData.avatar}`;
  }
  document.getElementById('modalAvatarImg').src = avatarUrl;
}

function closeEditModal() {
  const modal = document.getElementById('editModal');
  modal.classList.remove('show');
  setTimeout(() => modal.style.display = 'none', 300);
}

let currentUserData = {};

async function loadSettings() {
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    currentUserData = data;

    document.getElementById('profileUsernameDisplay').textContent = data.display_name || data.username;
    if (document.getElementById('profileEmailDisplay')) document.getElementById('profileEmailDisplay').textContent = data.email;
    if (data.avatar) {
      const avatarUrl = data.avatar.startsWith('http') ? data.avatar : `http://localhost:3000${data.avatar}`;
      document.getElementById('profileAvatar').src = avatarUrl;
      document.getElementById('modalAvatarImg').src = avatarUrl;
    }

    const joinDate = new Date(data.created_at);
    document.getElementById('joinDate').textContent = joinDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

    const diffTime = Math.abs(new Date() - joinDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime / (1000 * 60 * 60)) % 24);
    const diffMins = Math.floor((diffTime / 1000 / 60) % 60);

    let timeParts = [];
    if (diffDays > 0) timeParts.push(`${diffDays} วัน`);
    if (diffHours > 0) timeParts.push(`${diffHours} ชม.`);
    if (diffMins > 0 || timeParts.length === 0) timeParts.push(`${diffMins} นาที`);

    document.getElementById('memberTime').textContent = timeParts.join(' ');

    document.getElementById('firstName').value = data.first_name || '';
    document.getElementById('lastName').value = data.last_name || '';
    document.getElementById('nationalId').value = data.national_id || '';
    document.getElementById('phoneNumber').value = data.phone || '';

    const sm = data.social_media || {};
    document.getElementById('socialFb').value = sm.facebook || '';
    document.getElementById('socialIg').value = sm.instagram || '';
    document.getElementById('socialYt').value = sm.youtube || '';
    document.getElementById('socialTk').value = sm.tiktok || '';
    document.getElementById('socialTwitch').value = sm.twitch || '';

    const pm = data.payment_info || {};
    const pp = pm.promptpay || {};
    const ppToggle = document.getElementById('promptpayToggle');
    const ppValue = document.getElementById('promptpayValue');
    const ppLabel = document.getElementById('promptpayLabel');

    if (ppToggle) ppToggle.checked = pp.enabled || false;
    if (ppValue) {
      ppValue.value = data.phone || '';
    }

    if (ppLabel) {
      ppLabel.textContent = 'เบอร์โทรศัพท์';
      ppValue.placeholder = '08x-xxx-xxxx';
    }

    const ppStatusEl = document.getElementById('ppStatus');
    if (ppStatusEl) {
      if (pp.enabled) {
        ppStatusEl.textContent = '● เปิดใช้งาน';
        ppStatusEl.style.color = 'var(--accent-primary)';
      } else {
        ppStatusEl.textContent = '○ ปิดใช้งาน';
        ppStatusEl.style.color = 'var(--text-secondary)';
      }
    }

    console.log('Settings loaded successfully:', data.username);

  } catch (err) {
    console.error('Failed to load settings', err);
  }
}

document.getElementById('editAccountForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    display_name: document.getElementById('editDisplayName').value
  };

  const res = await updateUser(payload);

  if (res.ok) {
    closeEditModal();
    loadSettings();
    showToast('✓ อัปเดตบัญชีแล้ว');
  }
});

async function handleAvatarUpload(input) {
  if (!input.files || !input.files[0]) return;

  const formData = new FormData();
  formData.append('avatar', input.files[0]);

  try {
    const res = await fetch(`${API_URL}/users/me/avatar`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      const avatarUrl = `http://localhost:3000${data.avatar}`;
      document.getElementById('profileAvatar').src = avatarUrl;
      document.getElementById('modalAvatarImg').src = avatarUrl;

      showToast('✓ อัปเดตรูปโปรไฟล์แล้ว');
    } else {
      showToast(data.error || 'อัปโหลดรูปไม่สำเร็จ', true);
    }
  } catch (err) {
    console.error(err);
    showToast('เกิดข้อผิดพลาดในการอัปโหลดรูป', true);
  } finally {
    input.value = '';
  }
}

async function deleteAvatar() {
  const result = await Swal.fire({
    title: 'ลบรูปโปรไฟล์?',
    text: 'คุณต้องการลบรูปภาพนี้ใช่หรือไม่?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: 'transparent',
    cancelButtonColor: 'rgba(255,255,255,0.1)',
    confirmButtonText: 'ใช่, ลบทิ้ง',
    cancelButtonText: 'ยกเลิก',
    background: 'linear-gradient(145deg, #1e1e2d 0%, #161622 100%)',
    color: '#f8f9fa',
    backdrop: `
      rgba(0,0,0,0.85)
      backdrop-filter: blur(5px)
    `,
    customClass: {
      popup: 'swal-premium-popup swal-small',
      confirmButton: 'swal-premium-btn-danger',
      cancelButton: 'swal-premium-btn-cancel'
    }
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        document.getElementById('profileAvatar').src = '/default-avatar.png';
        document.getElementById('modalAvatarImg').src = '/default-avatar.png';

        Swal.fire({
          title: 'ลบสำเร็จ',
          text: 'ลบรูปโปรไฟล์เรียบร้อยแล้ว',
          icon: 'success',
          background: '#1a1a24',
          color: '#fff',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบรูปได้', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error');
    }
  }
}

document.getElementById('accountSettingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const phoneVal = document.getElementById('phoneNumber').value;
  if (phoneVal && phoneVal.replace(/\D/g, '').length !== 10) {
    showToast('✕ กรุณากรอกเบอร์โทรให้ครบ 10 หลัก', true, 3000);
    return;
  }

  const nationalIdVal = document.getElementById('nationalId').value;
  if (nationalIdVal && nationalIdVal.replace(/\D/g, '').length !== 13) {
    showToast('✕ กรุณากรอกเลขบัตรให้ครบ 13 หลัก', true, 3000);
    return;
  }

  const paymentInfo = currentUserData.payment_info || {};
  if (!paymentInfo.promptpay) paymentInfo.promptpay = { type: 'phone', enabled: false, value: '' };

  if (paymentInfo.promptpay.type === 'phone') {
    paymentInfo.promptpay.value = phoneVal;
  } else if (paymentInfo.promptpay.type === 'id') {
    paymentInfo.promptpay.value = nationalIdVal;
  }

  const payload = {
    first_name: document.getElementById('firstName').value,
    last_name: document.getElementById('lastName').value,
    national_id: nationalIdVal,
    phone: phoneVal,
    payment_info: paymentInfo,
    social_media: {
      facebook: document.getElementById('socialFb').value,
      instagram: document.getElementById('socialIg').value,
      youtube: document.getElementById('socialYt').value,
      tiktok: document.getElementById('socialTk').value,
      twitch: document.getElementById('socialTwitch').value
    }
  };

  const res = await updateUser(payload);

  if (res.ok) {
    showToast('✓ บันทึกโปรไฟล์เรียบร้อยแล้ว');
  } else {
    showToast('บันทึกข้อมูลไม่สำเร็จ', true);
  }
});

async function sendTestAlert() {
  const btn = document.getElementById('testAlertBtn');
  btn.disabled = true;
  btn.textContent = 'กำลังส่ง...';

  try {
    const res = await fetch(`${API_URL}/alerts/test`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      showToast('✓ ส่งการทดสอบแล้ว!');
    } else {
      showToast('ส่งการทดสอบไม่สำเร็จ', true);
    }
  } catch (err) {
    console.error(err);
    showToast('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'ทดสอบ';
  }
}

async function confirmDeleteAccount() {
  const result = await Swal.fire({
    title: 'ยืนยันการลบบัญชี',
    text: 'ข้อมูลทุกอย่างจะสูญหายอย่างถาวร คุณจะไม่สามารถกู้คืนได้อีก',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/9133/9133919.png',
    imageWidth: 80,
    imageHeight: 80,
    imageAlt: 'Warning Icon',
    showCancelButton: true,
    confirmButtonColor: 'transparent',
    cancelButtonColor: 'rgba(255,255,255,0.1)',
    confirmButtonText: 'ใช่, ลบถาวร',
    cancelButtonText: 'ยกเลิก',
    background: 'linear-gradient(145deg, #1e1e2d 0%, #161622 100%)',
    color: '#f8f9fa',
    backdrop: `
      rgba(0,0,0,0.85)
      backdrop-filter: blur(5px)
    `,
    customClass: {
      popup: 'swal-premium-popup',
      confirmButton: 'swal-premium-btn-danger',
      cancelButton: 'swal-premium-btn-cancel'
    }
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await Swal.fire({
          title: 'ลบสำเร็จ!',
          text: 'บัญชีของคุณถูกลบเรียบร้อยแล้ว',
          icon: 'success',
          background: '#1a1a24',
          color: '#fff',
          confirmButtonColor: '#3085d6'
        });
        logout();
      } else {
        Swal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถลบบัญชีได้',
          icon: 'error',
          background: '#1a1a24',
          color: '#fff'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้',
        icon: 'error',
        background: '#1a1a24',
        color: '#fff'
      });
    }
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

loadDonations();
loadSettings();

const savedTab = localStorage.getItem('activeTab');
if (savedTab) {
  switchTab(savedTab);
}

function formatPhoneNumber(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.length > 10) digits = digits.slice(0, 10);

  if (digits.length > 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length > 3) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return digits;
}

function syncPhoneFrom(sourceValue) {
  const formatted = formatPhoneNumber(sourceValue);
  document.getElementById('phoneNumber').value = formatted;
  document.getElementById('promptpayValue').value = formatted;
  return formatted;
}

document.getElementById('phoneNumber').addEventListener('input', (e) => {
  e.target.value = syncPhoneFrom(e.target.value);
});

function formatNationalId(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.length > 13) digits = digits.slice(0, 13);

  if (digits.length > 12) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits.slice(12)}`;
  } else if (digits.length > 10) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10)}`;
  } else if (digits.length > 5) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`;
  } else if (digits.length > 1) {
    return `${digits.slice(0, 1)}-${digits.slice(1)}`;
  }
  return digits;
}

function syncNationalIdFrom(sourceValue) {
  const formatted = formatNationalId(sourceValue);
  document.getElementById('nationalId').value = formatted;
  return formatted;
}

document.getElementById('nationalId').addEventListener('input', (e) => {
  e.target.value = syncNationalIdFrom(e.target.value);
});

document.getElementById('promptpayValue').addEventListener('input', (e) => {
  e.target.value = syncPhoneFrom(e.target.value);
});
