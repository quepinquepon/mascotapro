/**
 * MascotaPro v1.1 - Lógica principal completa
 */

const state = {
  currentView: 'home',
  currentPetId: null,
  editingPetId: null
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  const settings = getSettings();
  if (settings.theme === 'dark') document.body.classList.add('dark');

  // TEMPORAL: entrar directo sin pedir licencia (para pruebas)
  // Cuando todo funcione, volvemos a activar el control de licencia
  if (!getSavedLicense()) {
    saveLicense('DEMO');
  }
  showApp();
  setupEventListeners();
  checkReminders();
}

function showLicenseScreen() {
  document.getElementById('license-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('license-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  renderPets();
  updateLicenseStatus();
  populatePetSelects();
}

function setupEventListeners() {
  try {
  document.getElementById('btn-activate').addEventListener('click', handleActivateLicense);
  const btnDemo = document.getElementById('btn-demo');
  if (btnDemo) btnDemo.addEventListener('click', () => {
    saveLicense('DEMO');
    showToast('Modo Demo activado');
    setTimeout(showApp, 400);
  });
  document.getElementById('license-key').addEventListener('keypress', e => {
    if (e.key === 'Enter') handleActivateLicense();
  });

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });

  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.back || 'home'));
  });

  document.getElementById('btn-settings').addEventListener('click', () => navigateTo('settings'));
  document.getElementById('btn-notifications').addEventListener('click', () => navigateTo('reminders'));
  document.getElementById('btn-theme').addEventListener('click', toggleTheme);
  document.getElementById('btn-toggle-theme')?.addEventListener('click', toggleTheme);

  document.getElementById('btn-add-pet').addEventListener('click', () => openPetForm());
  document.getElementById('pet-form').addEventListener('submit', handleSavePet);

  document.getElementById('btn-add-vaccine').addEventListener('click', () => {
    populatePetSelects();
    document.getElementById('vaccine-form').reset();
    document.getElementById('vaccine-date').value = new Date().toISOString().slice(0, 10);
    navigateTo('vaccine-form');
  });
  document.getElementById('vaccine-form').addEventListener('submit', handleSaveVaccine);

  document.getElementById('btn-add-expense').addEventListener('click', () => {
    populatePetSelects();
    document.getElementById('expense-form').reset();
    document.getElementById('expense-date').value = new Date().toISOString().slice(0, 10);
    navigateTo('expense-form');
  });
  document.getElementById('expense-form').addEventListener('submit', handleSaveExpense);

  document.getElementById('btn-add-reminder').addEventListener('click', () => {
    populatePetSelects();
    document.getElementById('reminder-form').reset();
    navigateTo('reminder-form');
  });
  document.getElementById('reminder-form').addEventListener('submit', handleSaveReminder);

  document.getElementById('btn-generate-qr').addEventListener('click', generateQRCode);
  document.getElementById('btn-share-lost').addEventListener('click', shareLostLink);

  document.getElementById('btn-export-data').addEventListener('click', handleExportData);
  document.getElementById('btn-import-data').addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', handleImportData);
  document.getElementById('btn-clear-data').addEventListener('click', handleClearData);
  document.getElementById('btn-logout').addEventListener('click', handleLogout);
  document.getElementById('btn-gen-key').addEventListener('click', handleGenerateKey);
  } catch (err) {
    console.error('Error en setupEventListeners:', err);
  }
}

function handleActivateLicense() {
  const input = document.getElementById('license-key');
  const errorEl = document.getElementById('license-error');
  const key = input.value.trim();
  errorEl.classList.add('hidden');
  if (!key) { showError('Ingresá una clave de licencia'); return; }
  console.log('Validando clave:', key, 'Resultado:', isValidLicense(key));
  if (!isValidLicense(key)) { 
    showError('Clave inválida. Probá con: DEMO'); 
    return; 
  }
  saveLicense(key);
  showToast('¡Licencia activada!');
  setTimeout(showApp, 500);
}

function showError(msg) {
  const el = document.getElementById('license-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function updateLicenseStatus() {
  const el = document.getElementById('license-status');
  if (el) el.textContent = getSavedLicense() ? 'Activa' : 'No activada';
}

function handleLogout() {
  if (confirm('¿Cerrar sesión y volver a pedir licencia?')) {
    clearLicense();
    location.reload();
  }
}

function handleGenerateKey() {
  const key = generateLicenseKey();
  const box = document.getElementById('generated-keys');
  const div = document.createElement('div');
  div.className = 'list-item';
  div.innerHTML = '<div><div class="title" style="font-family:monospace">' + key + '</div><div class="meta">Tocá para copiar</div></div>';
  div.onclick = () => navigator.clipboard.writeText(key).then(() => showToast('Clave copiada'));
  box.prepend(div);
}

function navigateTo(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const map = {
    home: 'view-home', pet: 'view-pet', 'pet-form': 'view-pet-form',
    vaccines: 'view-vaccines', 'vaccine-form': 'view-vaccine-form',
    expenses: 'view-expenses', 'expense-form': 'view-expense-form',
    reminders: 'view-reminders', 'reminder-form': 'view-reminder-form',
    lost: 'view-lost', settings: 'view-settings'
  };
  const id = map[viewName];
  if (id) document.getElementById(id)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  state.currentView = viewName;
  if (viewName === 'home') renderPets();
  if (viewName === 'vaccines') renderVaccines();
  if (viewName === 'expenses') renderExpenses();
  if (viewName === 'reminders') renderReminders();
  if (viewName === 'lost') {
    populatePetSelects();
    const sel = document.getElementById('lost-pet-select');
    if (sel && sel.options.length > 1 && !sel.value) sel.selectedIndex = 1;
  }
  if (viewName === 'settings') updateLicenseStatus();
}

function populatePetSelects() {
  const pets = getPets();
  const options = pets.map(p => '<option value="' + p.id + '">' + escapeHtml(p.name) + '</option>').join('');
  ['vaccine-pet', 'expense-pet', 'reminder-pet', 'lost-pet-select'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const first = sel.querySelector('option[value=""]') ? sel.querySelector('option[value=""]').outerHTML : '<option value="">Seleccionar</option>';
    sel.innerHTML = first + options;
  });
}

function getPetEmoji(species) {
  if (species === 'perro') return '🐶';
  if (species === 'gato') return '🐱';
  return '🐾';
}

function escapeHtml(t) {
  if (!t) return '';
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2500);
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMoney(n) {
  return '$' + (parseFloat(n) || 0).toLocaleString('es-AR');
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  const s = getSettings();
  s.theme = isDark ? 'dark' : 'light';
  saveSettings(s);
  document.getElementById('btn-theme').textContent = isDark ? '☀️' : '🌙';
}

function renderPets() {
  const container = document.getElementById('pets-list');
  const empty = document.getElementById('empty-pets');
  const pets = getPets();
  if (pets.length === 0) {
    container.innerHTML = '';
    container.appendChild(empty);
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  container.innerHTML = pets.map(pet => 
    '<div class="pet-card" onclick="openPetDetail(\'' + pet.id + '\')">' +
    '<div class="pet-avatar">' + getPetEmoji(pet.species) + '</div>' +
    '<div class="pet-info"><h3>' + escapeHtml(pet.name) + '</h3>' +
    '<p>' + escapeHtml(pet.breed || pet.species || '') + (pet.weight ? ' · ' + pet.weight + ' kg' : '') + '</p></div></div>'
  ).join('');
}

function openPetDetail(id) {
  state.currentPetId = id;
  const pet = getPetById(id);
  if (!pet) return;
  const vaccines = getVaccinesByPet(id);
  const total = getTotalExpenses(id);
  document.getElementById('pet-detail-content').innerHTML = 
    '<div class="pet-card" style="margin-bottom:16px">' +
    '<div class="pet-avatar" style="width:72px;height:72px;font-size:36px">' + getPetEmoji(pet.species) + '</div>' +
    '<div class="pet-info"><h3 style="font-size:22px">' + escapeHtml(pet.name) + '</h3>' +
    '<p>' + escapeHtml(pet.breed || '') + ' · ' + escapeHtml(pet.species || '') + '</p>' +
    (pet.weight ? '<p>Peso: ' + pet.weight + ' kg</p>' : '') +
    (pet.chip ? '<p>Chip: ' + escapeHtml(pet.chip) + '</p>' : '') +
    (pet.birthday ? '<p>Nacimiento: ' + formatDate(pet.birthday) + '</p>' : '') +
    '</div></div>' +
    (pet.notes ? '<div class="list-item"><div><div class="title">Notas</div><div class="meta">' + escapeHtml(pet.notes) + '</div></div></div>' : '') +
    '<div class="stats-row"><div class="stat-box"><div class="stat-num">' + vaccines.length + '</div><div class="stat-label">Vacunas</div></div>' +
    '<div class="stat-box"><div class="stat-num">' + formatMoney(total) + '</div><div class="stat-label">Gastos</div></div></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px">' +
    '<button class="btn btn-secondary" onclick="navigateTo(\'vaccines\')">💉 Vacunas</button>' +
    '<button class="btn btn-secondary" onclick="navigateTo(\'expenses\')">💰 Gastos</button>' +
    '<button class="btn btn-secondary" onclick="openPetForm(\'' + pet.id + '\')">✏️ Editar</button>' +
    '<button class="btn btn-danger" onclick="confirmDeletePet(\'' + pet.id + '\')">🗑️ Eliminar</button></div>';
  navigateTo('pet');
}

function openPetForm(editId) {
  state.editingPetId = editId || null;
  document.getElementById('pet-form').reset();
  document.getElementById('form-title').textContent = editId ? 'Editar mascota' : 'Nueva mascota';
  if (editId) {
    const pet = getPetById(editId);
    if (pet) {
      document.getElementById('pet-name').value = pet.name || '';
      document.getElementById('pet-species').value = pet.species || '';
      document.getElementById('pet-breed').value = pet.breed || '';
      document.getElementById('pet-birthday').value = pet.birthday || '';
      document.getElementById('pet-weight').value = pet.weight || '';
      document.getElementById('pet-chip').value = pet.chip || '';
      document.getElementById('pet-notes').value = pet.notes || '';
    }
  }
  navigateTo('pet-form');
}

function handleSavePet(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('pet-name').value.trim(),
    species: document.getElementById('pet-species').value,
    breed: document.getElementById('pet-breed').value.trim(),
    birthday: document.getElementById('pet-birthday').value,
    weight: document.getElementById('pet-weight').value,
    chip: document.getElementById('pet-chip').value.trim(),
    notes: document.getElementById('pet-notes').value.trim()
  };
  if (!data.name || !data.species) { showToast('Nombre y especie son obligatorios'); return; }
  if (state.editingPetId) {
    updatePet(state.editingPetId, data);
    showToast('Mascota actualizada');
  } else {
    addPet(data);
    showToast('Mascota agregada');
  }
  state.editingPetId = null;
  navigateTo('home');
}

function confirmDeletePet(id) {
  const pet = getPetById(id);
  if (!pet) return;
  if (confirm('¿Eliminar a ' + pet.name + '? Se borrarán también sus vacunas, gastos y recordatorios.')) {
    deletePet(id);
    showToast('Mascota eliminada');
    navigateTo('home');
  }
}

function renderVaccines() {
  const list = document.getElementById('vaccines-list');
  const vaccines = getVaccines().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  if (vaccines.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">💉</div><p>No hay vacunas registradas</p><button class="btn btn-primary" onclick="document.getElementById(\'btn-add-vaccine\').click()">Agregar vacuna</button></div>';
    return;
  }
  list.innerHTML = vaccines.map(v => {
    const pet = getPetById(v.petId);
    return '<div class="list-item"><div><div class="title">' + escapeHtml(v.name) + '</div>' +
      '<div class="meta">' + (pet ? escapeHtml(pet.name) : 'Mascota') + ' · ' + formatDate(v.date) + '</div>' +
      (v.nextDate ? '<div class="meta">Próxima: ' + formatDate(v.nextDate) + '</div>' : '') +
      (v.vet ? '<div class="meta">' + escapeHtml(v.vet) + '</div>' : '') +
      '</div><button class="icon-btn" onclick="deleteVaccineAndRefresh(\'' + v.id + '\')">🗑️</button></div>';
  }).join('');
}

function handleSaveVaccine(e) {
  e.preventDefault();
  const data = {
    petId: document.getElementById('vaccine-pet').value,
    name: document.getElementById('vaccine-name').value.trim(),
    date: document.getElementById('vaccine-date').value,
    nextDate: document.getElementById('vaccine-next').value || null,
    vet: document.getElementById('vaccine-vet').value.trim(),
    notes: document.getElementById('vaccine-notes').value.trim()
  };
  if (!data.petId || !data.name || !data.date) { showToast('Completá los campos obligatorios'); return; }
  addVaccine(data);
  if (data.nextDate && document.getElementById('vaccine-remind').checked) {
    addReminder({
      petId: data.petId,
      title: 'Vacuna: ' + data.name,
      datetime: data.nextDate + 'T09:00',
      notes: 'Recordatorio automático de vacuna'
    });
    showToast('Vacuna y recordatorio guardados');
  } else {
    showToast('Vacuna guardada');
  }
  navigateTo('vaccines');
}

function deleteVaccineAndRefresh(id) {
  if (confirm('¿Eliminar esta vacuna?')) {
    deleteVaccine(id);
    renderVaccines();
    showToast('Vacuna eliminada');
  }
}

function renderExpenses() {
  const list = document.getElementById('expenses-list');
  const summary = document.getElementById('expenses-summary');
  const total = getTotalExpenses();
  const expenses = getExpenses().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  summary.innerHTML = '<div class="amount">' + formatMoney(total) + '</div><div class="label">Total registrado</div>';
  if (expenses.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">💰</div><p>No hay gastos registrados</p><button class="btn btn-primary" onclick="document.getElementById(\'btn-add-expense\').click()">Agregar gasto</button></div>';
    return;
  }
  list.innerHTML = expenses.map(e => {
    const pet = e.petId ? getPetById(e.petId) : null;
    return '<div class="list-item"><div><div class="title">' + escapeHtml(e.description) + '</div>' +
      '<div class="meta">' + formatDate(e.date) + ' · ' + escapeHtml(e.category || '') + (pet ? ' · ' + escapeHtml(pet.name) : '') + '</div></div>' +
      '<div style="display:flex;align-items:center;gap:8px"><strong>' + formatMoney(e.amount) + '</strong>' +
      '<button class="icon-btn" onclick="deleteExpenseAndRefresh(\'' + e.id + '\')">🗑️</button></div></div>';
  }).join('');
}

function handleSaveExpense(e) {
  e.preventDefault();
  const data = {
    petId: document.getElementById('expense-pet').value || null,
    description: document.getElementById('expense-desc').value.trim(),
    amount: document.getElementById('expense-amount').value,
    date: document.getElementById('expense-date').value,
    category: document.getElementById('expense-category').value
  };
  if (!data.description || !data.amount || !data.date) { showToast('Completá los campos obligatorios'); return; }
  addExpense(data);
  showToast('Gasto guardado');
  navigateTo('expenses');
}

function deleteExpenseAndRefresh(id) {
  if (confirm('¿Eliminar este gasto?')) {
    deleteExpense(id);
    renderExpenses();
    showToast('Gasto eliminado');
  }
}

function renderReminders() {
  const list = document.getElementById('reminders-list');
  const reminders = getReminders().sort((a, b) => (a.datetime || '').localeCompare(b.datetime || ''));
  if (reminders.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔔</div><p>No hay recordatorios</p><button class="btn btn-primary" onclick="document.getElementById(\'btn-add-reminder\').click()">Crear recordatorio</button></div>';
    return;
  }
  const now = new Date();
  list.innerHTML = reminders.map(r => {
    const pet = r.petId ? getPetById(r.petId) : null;
    const dt = new Date(r.datetime);
    const isPast = dt < now;
    const isDone = r.done;
    return '<div class="list-item' + (isDone ? ' done' : '') + (isPast && !isDone ? ' overdue' : '') + '"><div>' +
      '<div class="title">' + escapeHtml(r.title) + '</div>' +
      '<div class="meta">' + dt.toLocaleString('es-AR') + (pet ? ' · ' + escapeHtml(pet.name) : '') + '</div>' +
      (r.notes ? '<div class="meta">' + escapeHtml(r.notes) + '</div>' : '') +
      '</div><div style="display:flex;gap:4px">' +
      (!isDone ? '<button class="icon-btn" onclick="markDoneAndRefresh(\'' + r.id + '\')">✅</button>' : '') +
      '<button class="icon-btn" onclick="deleteReminderAndRefresh(\'' + r.id + '\')">🗑️</button></div></div>';
  }).join('');
}

function handleSaveReminder(e) {
  e.preventDefault();
  const data = {
    petId: document.getElementById('reminder-pet').value || null,
    title: document.getElementById('reminder-title').value.trim(),
    datetime: document.getElementById('reminder-datetime').value,
    notes: document.getElementById('reminder-notes').value.trim()
  };
  if (!data.title || !data.datetime) { showToast('Completá título y fecha'); return; }
  addReminder(data);
  showToast('Recordatorio guardado');
  requestNotificationPermission();
  navigateTo('reminders');
}

function markDoneAndRefresh(id) {
  markReminderDone(id);
  renderReminders();
  showToast('Marcado como hecho');
}

function deleteReminderAndRefresh(id) {
  if (confirm('¿Eliminar este recordatorio?')) {
    deleteReminder(id);
    renderReminders();
    showToast('Eliminado');
  }
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function checkReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  getReminders().filter(r => !r.done).forEach(r => {
    const dt = new Date(r.datetime);
    const diff = dt - now;
    if (diff > -60000 && diff < 5 * 60 * 1000) {
      new Notification('MascotaPro – Recordatorio', {
        body: r.title + (r.notes ? '\n' + r.notes : ''),
        icon: 'icons/icon-192.png',
        tag: r.id
      });
    }
  });
}
setInterval(checkReminders, 60 * 1000);

function generateQRCode() {
  const petId = document.getElementById('lost-pet-select').value;
  if (!petId) { showToast('Seleccioná una mascota'); return; }
  const pet = getPetById(petId);
  if (!pet) return;
  const base = window.location.href.split('?')[0].replace(/\/$/, '');
  const reportUrl = base + '?lost=' + pet.id + '&name=' + encodeURIComponent(pet.name);
  const container = document.getElementById('qr-container');
  container.innerHTML = '<canvas id="qr-canvas"></canvas><p style="margin-top:10px;font-size:13px;word-break:break-all" id="qr-url"></p>';
  if (typeof QRCode !== 'undefined') {
    QRCode.toCanvas(document.getElementById('qr-canvas'), reportUrl, {
      width: 200, margin: 2, color: { dark: '#0f766e', light: '#ffffff' }
    }, err => {
      if (err) container.innerHTML = '<p class="muted">Error al generar QR.<br>' + reportUrl + '</p>';
      else {
        document.getElementById('qr-url').textContent = reportUrl;
        showToast('QR generado');
      }
    });
  } else {
    container.innerHTML = '<p class="muted">Enlace de reporte:<br>' + reportUrl + '</p>';
  }
  window._lastLostUrl = reportUrl;
  window._lastLostPet = pet.name;
}

function shareLostLink() {
  const url = window._lastLostUrl;
  if (!url) { showToast('Primero generá el QR'); return; }
  const text = 'Si encontraste a ' + (window._lastLostPet || 'mi mascota') + ', reportalo aquí: ' + url;
  if (navigator.share) {
    navigator.share({ title: 'Mascota perdida', text: text, url: url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => showToast('Enlace copiado'));
  }
}

function handleExportData() {
  const data = exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mascotapro-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Datos exportados');
}

function handleImportData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (confirm('Esto reemplazará tus datos actuales. ¿Continuar?')) {
        importAllData(data);
        showToast('Datos importados');
        renderPets();
      }
    } catch { showToast('Archivo inválido'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function handleClearData() {
  if (confirm('¿Borrar TODAS las mascotas, vacunas, gastos y recordatorios?')) {
    clearAllData();
    showToast('Datos eliminados');
    renderPets();
  }
}

window.openPetDetail = openPetDetail;
window.openPetForm = openPetForm;
window.confirmDeletePet = confirmDeletePet;
window.navigateTo = navigateTo;
window.deleteVaccineAndRefresh = deleteVaccineAndRefresh;
window.deleteExpenseAndRefresh = deleteExpenseAndRefresh;
window.markDoneAndRefresh = markDoneAndRefresh;
window.deleteReminderAndRefresh = deleteReminderAndRefresh;
