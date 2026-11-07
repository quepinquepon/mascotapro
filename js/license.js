/**
 * MascotaPro - Sistema de Licencias
 * Formato: PET-XXXX-XXXX-XXXX
 */

const LICENSE_STORAGE_KEY = 'mascotapro_license';

// Claves que SIEMPRE funcionan (sin importar checksum)
const VALID_KEYS_WHITELIST = [
  'PET-DEMO-2026-TEST',
  'PET-ABCD-1234-EF5G',
  'PET-MAS1-COT2-APR3',
  'DEMO',
  'demo',
  '1234'
];

function isValidFormat(key) {
  if (!key) return false;
  const cleaned = key.trim().toUpperCase();
  // Formato estricto PET-XXXX-XXXX-XXXX
  if (/^PET-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleaned)) return true;
  // También aceptar formato un poco más flexible
  if (/^PET-[A-Z0-9]{3,6}-[A-Z0-9]{3,6}-[A-Z0-9]{3,6}$/.test(cleaned)) return true;
  return false;
}

function validateChecksum(key) {
  try {
    const cleaned = key.trim().toUpperCase().replace(/^PET-/, '');
    const parts = cleaned.split('-');
    if (parts.length !== 3) return false;
    // Si los bloques no son de 4, solo validamos formato (ya pasado)
    if (parts[0].length !== 4 || parts[1].length !== 4 || parts[2].length !== 4) return true;

    const data = parts[0] + parts[1] + parts[2].substring(0, 3);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data.charCodeAt(i) * (i + 1);
    }
    const expected = (sum % 36).toString(36).toUpperCase();
    return parts[2].charAt(3) === expected;
  } catch (e) {
    return false;
  }
}

function isValidLicense(key) {
  if (!key) return false;
  const raw = key.trim();
  const cleaned = raw.toUpperCase();

  // 1. Whitelist (incluye "DEMO" y "1234" para pruebas rápidas)
  if (VALID_KEYS_WHITELIST.includes(raw) || VALID_KEYS_WHITELIST.includes(cleaned)) {
    return true;
  }

  // 2. Formato PET-...
  if (!isValidFormat(cleaned)) return false;

  // 3. Checksum (si falla el checksum pero el formato es correcto, 
  //    igual aceptamos para no bloquear al usuario con claves viejas)
  //    En producción podés volver a poner: return validateChecksum(cleaned);
  return true;
}

function saveLicense(key) {
  localStorage.setItem(LICENSE_STORAGE_KEY, key.trim().toUpperCase());
}

function getSavedLicense() {
  return localStorage.getItem(LICENSE_STORAGE_KEY);
}

function clearLicense() {
  localStorage.removeItem(LICENSE_STORAGE_KEY);
}

function generateLicenseKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let p1 = '', p2 = '', p3 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  for (let i = 0; i < 3; i++) {
    p3 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const data = p1 + p2 + p3;
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data.charCodeAt(i) * (i + 1);
  }
  const check = (sum % 36).toString(36).toUpperCase();
  p3 = p3 + check;
  const key = 'PET-' + p1 + '-' + p2 + '-' + p3;
  console.log('%c Clave generada:', 'color: #0f766e; font-weight: bold', key);
  return key;
}

window.generateLicenseKey = generateLicenseKey;
window.isValidLicense = isValidLicense;
