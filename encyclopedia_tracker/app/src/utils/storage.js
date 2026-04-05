const STORAGE_KEY = 'acnh-encyclopedia-collected';

export function getCollected() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCollected(collected) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collected));
}

export function toggleCollected(creatureId) {
  const collected = getCollected();
  if (collected[creatureId]) {
    delete collected[creatureId];
  } else {
    collected[creatureId] = true;
  }
  saveCollected(collected);
  return collected;
}

export function setMultipleCollected(creatureIds, value = true) {
  const collected = getCollected();
  for (const id of creatureIds) {
    if (value) {
      collected[id] = true;
    } else {
      delete collected[id];
    }
  }
  saveCollected(collected);
  return collected;
}

export function clearAllCollected() {
  localStorage.removeItem(STORAGE_KEY);
  return {};
}

const SETTINGS_KEY = 'acnh-encyclopedia-settings';

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
