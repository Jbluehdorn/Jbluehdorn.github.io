// Probability engine — loaded before the React app
// Exposes window.VillagerEngine after villagers.json is fetched

window.VillagerEngine = (function () {
  const villagerMap = new Map();
  const speciesGroups = new Map();
  const villagers = window.VILLAGER_DATA;

  villagers.forEach(v => {
    villagerMap.set(v.name.toLowerCase(), v);
    if (!speciesGroups.has(v.species)) {
      speciesGroups.set(v.species, []);
    }
    speciesGroups.get(v.species).push(v);
  });

  const totalSpecies = speciesGroups.size;
  const allNames = villagers.map(v => v.name).sort();

  function getAllVillagerNames() {
    return allNames;
  }

  function getVillagerInfo(name) {
    return villagerMap.get(name.toLowerCase()) || null;
  }

  // Build adjusted species groups after removing excluded villagers
  function getAdjustedGroups(excludedNames) {
    const excluded = new Set(excludedNames.map(n => n.toLowerCase()));
    const adjusted = new Map();

    speciesGroups.forEach((members, species) => {
      const remaining = members.filter(v => !excluded.has(v.name.toLowerCase()));
      if (remaining.length > 0) {
        adjusted.set(species, remaining);
      }
    });

    return adjusted;
  }

  function calculateResults(villagerNames, attempts, excludedNames) {
    const excluded = excludedNames || [];
    const adjusted = getAdjustedGroups(excluded);
    const adjSpeciesCount = adjusted.size;

    const results = [];
    let combinedSingleAttemptProb = 0;

    for (const name of villagerNames) {
      const v = villagerMap.get(name.toLowerCase());
      if (!v) continue;

      const speciesMembers = adjusted.get(v.species);
      if (!speciesMembers) continue;

      const p = (1 / adjSpeciesCount) * (1 / speciesMembers.length);
      const pInN = 1 - Math.pow(1 - p, attempts);

      results.push({
        name: v.name,
        species: v.species,
        icon: v.iconImage,
        singleProbability: p,
        probabilityInAttempts: pInN
      });

      combinedSingleAttemptProb += p;
    }

    combinedSingleAttemptProb = Math.min(combinedSingleAttemptProb, 1);
    const combinedProbability = 1 - Math.pow(1 - combinedSingleAttemptProb, attempts);

    const mostLikely = results.length > 0
      ? results.reduce((best, r) => r.singleProbability > best.singleProbability ? r : best)
      : null;

    return {
      individual: results.sort((a, b) => b.probabilityInAttempts - a.probabilityInAttempts),
      combinedProbability,
      mostLikely,
      attempts
    };
  }

  return { getAllVillagerNames, getVillagerInfo, calculateResults };
})();
