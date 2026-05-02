// ── API helper ──
const api = {
  async get(url) {
    const res = await fetch(url);
    if (res.status === 401) { window.location.href = '/login'; return null; }
    return res.json();
  },
  async post(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async put(url, data) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async delete(url) {
    const res = await fetch(url, { method: 'DELETE' });
    return res.json();
  },
  async postForm(url, formData) {
    const res = await fetch(url, { method: 'POST', body: formData });
    return res.json();
  }
};

// ── Toast notifications ──
const Toast = {
  container: null,
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info', duration = 3500) {
    this.init();
    const toast = document.createElement('div');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || '📌'}</span><span>${message}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'none';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  info(msg) { this.show(msg, 'info'); }
};

// ── Modal ──
const Modal = {
  open(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.add('active');
  },
  close(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.remove('active');
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  }
};

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    Modal.closeAll();
  }
});

// ── Date helpers ──
const DateHelper = {
  format(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  },
  isExpired(date) {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const d = new Date(date); d.setHours(0,0,0,0);
    return d < hoy;
  },
  daysRemaining(date) {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const d = new Date(date); d.setHours(0,0,0,0);
    return Math.ceil((d - hoy) / (1000 * 60 * 60 * 24));
  },
  badge(date) {
    const expired = this.isExpired(date);
    const cls = expired ? 'badge-vencido' : 'badge-vigente';
    const text = expired ? 'Vencido' : 'Vigente';
    return `<span class="badge ${cls} badge-dot">${text}</span>`;
  }
};

// ── Document type labels ──
const TIPO_LABELS = {
  cedula_identidad: 'Cédula de Identidad',
  antecedentes: 'Antecedentes',
  contrato: 'Contrato',
  licencia_conducir: 'Licencia de Conducir',
  examen_medico: 'Examen Médico',
  capacitacion: 'Capacitación',
  seguro: 'Seguro',
  otro: 'Otro'
};

const DOC_ICONS = {
  cedula_identidad: '🪪',
  antecedentes: '📋',
  contrato: '📝',
  licencia_conducir: '🚗',
  examen_medico: '🏥',
  capacitacion: '🎓',
  seguro: '🛡️',
  otro: '📄'
};

// ── Session check ──
async function checkSession() {
  const data = await api.get('/api/auth/session');
  if (!data || !data.loggedIn) {
    window.location.href = '/login';
    return null;
  }
  return data;
}

// ── Logout ──
async function logout() {
  await api.post('/api/auth/logout', {});
  window.location.href = '/login';
}

// ── Export functions ──
function exportWorkerExcel(workerId) {
  window.open(`/api/workers/export/excel/${workerId}`, '_blank');
  Toast.success('Descargando Excel...');
}

function exportWorkerPDF(workerId) {
  window.open(`/api/workers/export/pdf/${workerId}`, '_blank');
  Toast.success('Descargando PDF...');
}

// ── Confirm dialog ──
function confirmAction(message, onConfirm) {
  if (confirm(message)) {
    onConfirm();
  }
}
