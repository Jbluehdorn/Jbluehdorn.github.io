const COLLECTED_KEY = 'acnh-tools-encyclopedia-collected';
const SETTINGS_KEY = 'acnh-tools-settings';

export function getCollected() {
  try {
    const raw = localStorage.getItem(COLLECTED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCollected(collected) {
  localStorage.setItem(COLLECTED_KEY, JSON.stringify(collected));
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { hemisphere: 'north' };
  } catch {
    return { hemisphere: 'north' };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
