import { useState, useEffect } from 'react'

export function useArtworkData() {
  const [artwork, setArtwork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const base = import.meta.env.BASE_URL;
        const data = await fetch(`${base}data/artwork.json`).then(r => r.json());
        setArtwork(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const paintings = artwork.filter(a => a.art_type === 'Painting');
  const statues = artwork.filter(a => a.art_type === 'Statue');

  return { artwork, paintings, statues, loading, error };
}
