/**
 * Sistem Lisensi & Trial 1-Device 1-Serial
 * 
 * - Device ID: Di-generate unik per browser/device (disimpan di localStorage).
 * - Serial Key Format: LIC-[Part2Reversed]-[Part1Reversed]
 *   Contoh: Device ID = DEV-A1B2-C3D4
 *   Part 1 = A1B2 (reversed = 2B1A)
 *   Part 2 = C3D4 (reversed = 4D3C)
 *   Serial Key = LIC-4D3C-2B1A
 * 
 * - Bypass/Master Key: LIC-FULL-ACCESS atau LIC-BUMMI-DESAIN-2026
 * - Trial Limit: Maksimal 5 transaksi (Order).
 */

const STORAGE_KEYS = {
  LICENSE_SERIAL: 'bummi_license_serial',
  DEVICE_ID: 'bummi_license_device_id',
};

export const TRIAL_LIMIT = 5;

export function getDeviceId(): string {
  let devId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!devId) {
    const randomBlock = () => Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
      .toUpperCase();
    devId = `DEV-${randomBlock()}-${randomBlock()}`;
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, devId);
  }
  return devId;
}

export function getSerialKey(): string {
  return localStorage.getItem(STORAGE_KEYS.LICENSE_SERIAL) || '';
}

export function validateSerial(deviceId: string, serial: string): boolean {
  if (!serial) return false;
  
  const cleanedSerial = serial.trim().toUpperCase();
  
  // Master Keys
  if (
    cleanedSerial === 'LIC-FULL-ACCESS' ||
    cleanedSerial === 'LIC-OMS-PRO-2026' ||
    cleanedSerial === 'LIC-BUMMI-DESAIN-2026'
  ) {
    return true;
  }
  
  const cleanedDevice = deviceId.replace('DEV-', '').toUpperCase();
  const parts = cleanedDevice.split('-');
  if (parts.length !== 2) return false;
  
  const part1Rev = parts[0].split('').reverse().join('');
  const part2Rev = parts[1].split('').reverse().join('');
  const expectedSerial = `LIC-${part2Rev}-${part1Rev}`;
  
  return cleanedSerial === expectedSerial;
}

export function isActivated(): boolean {
  const deviceId = getDeviceId();
  const serial = getSerialKey();
  return validateSerial(deviceId, serial);
}

export function activateLicense(serial: string): boolean {
  const deviceId = getDeviceId();
  if (validateSerial(deviceId, serial)) {
    localStorage.setItem(STORAGE_KEYS.LICENSE_SERIAL, serial.trim().toUpperCase());
    return true;
  }
  return false;
}

export function deactivateLicense(): void {
  localStorage.removeItem(STORAGE_KEYS.LICENSE_SERIAL);
}

export function getRemainingTransactions(ordersCount: number): number {
  if (isActivated()) return Infinity;
  return Math.max(0, TRIAL_LIMIT - ordersCount);
}

export function canAddTransaction(ordersCount: number): boolean {
  if (isActivated()) return true;
  return ordersCount < TRIAL_LIMIT;
}

// Generate the valid serial key for a given device id (for simulation or help info)
export function getCorrectSerialForDevice(deviceId: string): string {
  const cleanedDevice = deviceId.replace('DEV-', '').toUpperCase();
  const parts = cleanedDevice.split('-');
  if (parts.length !== 2) return '';
  const part1Rev = parts[0].split('').reverse().join('');
  const part2Rev = parts[1].split('').reverse().join('');
  return `LIC-${part2Rev}-${part1Rev}`;
}
