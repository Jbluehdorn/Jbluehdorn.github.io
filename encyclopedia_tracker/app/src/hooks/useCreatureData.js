import { useState, useEffect } from 'react';

export function useCreatureData() {
  const [data, setData] = useState({ fish: [], insects: [], seaCreatures: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const base = import.meta.env.BASE_URL;
        const [fish, insects, seaCreatures] = await Promise.all([
          fetch(`${base}data/fish.json`).then(r => r.json()),
          fetch(`${base}data/insects.json`).then(r => r.json()),
          fetch(`${base}data/sea-creatures.json`).then(r => r.json()),
        ]);

        // Add a 'type' field to each creature for easier filtering
        fish.forEach(c => c.type = 'fish');
        insects.forEach(c => c.type = 'insect');
        seaCreatures.forEach(c => c.type = 'sea-creature');

        setData({ fish, insects, seaCreatures });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const allCreatures = [...data.fish, ...data.insects, ...data.seaCreatures];

  return { ...data, allCreatures, loading, error };
}
