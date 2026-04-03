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

  // P = (1 / totalSpecies) * (1 / villagersInThatSpecies)
  function getVillagerProbability(villagerName) {
    const v = villagerMap.get(villagerName.toLowerCase());
    if (!v) return 0;
    const speciesCount = speciesGroups.get(v.species).length;
    return (1 / totalSpecies) * (1 / speciesCount);
  }

  function calculateResults(villagerNames, attempts) {
    const results = [];
    let combinedSingleAttemptProb = 0;

    for (const name of villagerNames) {
      const v = villagerMap.get(name.toLowerCase());
      if (!v) continue;

      const p = getVillagerProbability(name);
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

  return { getAllVillagerNames, getVillagerInfo, getVillagerProbability, calculateResults };
})();
