export function analyzeDiversity(villagers, engine) {
  if (!villagers || villagers.length === 0 || !engine) {
    return { species: [], personality: [], gender: [], gaps: [] };
  }

  const speciesMap = new Map();
  const personalityMap = new Map();
  const genderMap = new Map();

  const ALL_PERSONALITIES = ['Lazy', 'Jock', 'Cranky', 'Smug', 'Normal', 'Peppy', 'Snooty', 'Uchi'];

  for (const name of villagers) {
    const info = engine.getVillagerInfo(name);
    if (!info) continue;

    speciesMap.set(info.species, (speciesMap.get(info.species) || 0) + 1);
    personalityMap.set(info.personality, (personalityMap.get(info.personality) || 0) + 1);
    genderMap.set(info.gender, (genderMap.get(info.gender) || 0) + 1);
  }

  const species = [...speciesMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const personality = ALL_PERSONALITIES.map(p => ({
    name: p,
    count: personalityMap.get(p) || 0,
  }));

  const gender = ['Male', 'Female'].map(g => ({
    name: g,
    count: genderMap.get(g) || 0,
  }));

  const gaps = [];

  // Duplicate species
  const dupeSpecies = species.filter(s => s.count > 1);
  if (dupeSpecies.length > 0) {
    dupeSpecies.forEach(s => {
      gaps.push({ type: 'warning', message: `${s.count} ${s.name} villagers` });
    });
  }

  // Missing personalities
  const missingPersonalities = personality.filter(p => p.count === 0);
  if (missingPersonalities.length > 0) {
    missingPersonalities.forEach(p => {
      gaps.push({ type: 'info', message: `No ${p.name} villager` });
    });
  }

  return { species, personality, gender, gaps };
}

export function getUpcomingBirthdays(villagers, engine, daysAhead = 7) {
  const today = new Date();
  const upcoming = [];

  for (const name of villagers) {
    const info = engine.getVillagerInfo(name);
    if (!info || !info.birthday) continue;

    const [month, day] = info.birthday.split('/').map(Number);
    if (!month || !day) continue;

    const birthday = new Date(today.getFullYear(), month - 1, day);
    // If birthday already passed this year, check next year
    if (birthday < today) {
      birthday.setFullYear(birthday.getFullYear() + 1);
    }

    const diffDays = Math.ceil((birthday - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= daysAhead) {
      upcoming.push({
        name: info.name,
        birthday: info.birthday,
        daysUntil: diffDays,
        isToday: diffDays === 0,
      });
    }
  }

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
}
