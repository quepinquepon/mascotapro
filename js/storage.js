/**
 * MascotaPro - Almacenamiento local (localStorage)
 * Offline-first
 */

const STORAGE_KEYS = {
  pets: 'mascotapro_pets',
  vaccines: 'mascotapro_vaccines',
  expenses: 'mascotapro_expenses',
  reminders: 'mascotapro_reminders',
  settings: 'mascotapro_settings'
};

// ========== PETS ==========
function getPets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.pets)) || []; }
  catch { return []; }
}
function savePets(pets) { localStorage.setItem(STORAGE_KEYS.pets, JSON.stringify(pets)); }

function addPet(pet) {
  const pets = getPets();
  pet.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  pet.createdAt = new Date().toISOString();
  pets.push(pet);
  savePets(pets);
  return pet;
}
function updatePet(id, data) {
  const pets = getPets();
  const i = pets.findIndex(p => p.id === id);
  if (i === -1) return null;
  pets[i] = { ...pets[i], ...data, updatedAt: new Date().toISOString() };
  savePets(pets);
  return pets[i];
}
function deletePet(id) {
  savePets(getPets().filter(p => p.id !== id));
  saveVaccines(getVaccines().filter(v => v.petId !== id));
  saveExpenses(getExpenses().filter(e => e.petId !== id));
  saveReminders(getReminders().filter(r => r.petId !== id));
}
function getPetById(id) { return getPets().find(p => p.id === id) || null; }

// ========== VACCINES ==========
function getVaccines() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.vaccines)) || []; }
  catch { return []; }
}
function saveVaccines(list) { localStorage.setItem(STORAGE_KEYS.vaccines, JSON.stringify(list)); }

function addVaccine(v) {
  const list = getVaccines();
  v.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  v.createdAt = new Date().toISOString();
  list.push(v);
  saveVaccines(list);
  return v;
}
function deleteVaccine(id) {
  saveVaccines(getVaccines().filter(v => v.id !== id));
}
function getVaccinesByPet(petId) {
  return getVaccines().filter(v => v.petId === petId);
}

// ========== EXPENSES ==========
function getExpenses() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.expenses)) || []; }
  catch { return []; }
}
function saveExpenses(list) { localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(list)); }

function addExpense(e) {
  const list = getExpenses();
  e.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  e.createdAt = new Date().toISOString();
  list.push(e);
  saveExpenses(list);
  return e;
}
function deleteExpense(id) {
  saveExpenses(getExpenses().filter(e => e.id !== id));
}
function getExpensesByPet(petId) {
  return getExpenses().filter(e => e.petId === petId);
}
function getTotalExpenses(petId = null) {
  const list = petId ? getExpensesByPet(petId) : getExpenses();
  return list.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
}

// ========== REMINDERS ==========
function getReminders() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.reminders)) || []; }
  catch { return []; }
}
function saveReminders(list) { localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(list)); }

function addReminder(r) {
  const list = getReminders();
  r.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  r.createdAt = new Date().toISOString();
  r.done = false;
  list.push(r);
  saveReminders(list);
  return r;
}
function deleteReminder(id) {
  saveReminders(getReminders().filter(r => r.id !== id));
}
function markReminderDone(id) {
  const list = getReminders();
  const i = list.findIndex(r => r.id === id);
  if (i !== -1) {
    list[i].done = true;
    saveReminders(list);
  }
}

// ========== SETTINGS ==========
function getSettings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)) || {}; }
  catch { return {}; }
}
function saveSettings(s) { localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(s)); }

// ========== EXPORT / IMPORT / CLEAR ==========
function exportAllData() {
  return {
    version: '1.1.0',
    exportedAt: new Date().toISOString(),
    pets: getPets(),
    vaccines: getVaccines(),
    expenses: getExpenses(),
    reminders: getReminders()
  };
}
function importAllData(data) {
  if (data.pets) savePets(data.pets);
  if (data.vaccines) saveVaccines(data.vaccines);
  if (data.expenses) saveExpenses(data.expenses);
  if (data.reminders) saveReminders(data.reminders);
}
function clearAllData() {
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
}
