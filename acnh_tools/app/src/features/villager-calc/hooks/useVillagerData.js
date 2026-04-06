import { useState, useEffect } from 'react'

export function useVillagerData() {
  const [villagers, setVillagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const base = import.meta.env.BASE_URL;
        const data = await fetch(`${base}data/villagers.json`).then(r => r.json());
        setVillagers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return { villagers, loading, error };
}
