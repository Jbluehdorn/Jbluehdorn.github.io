import { useState, useEffect } from 'react';
import { getCollected, saveCollected } from '../utils/storage';

export function useCollected() {
  const [collected, setCollected] = useState(() => getCollected());

  useEffect(() => {
    saveCollected(collected);
  }, [collected]);

  const toggle = (creatureId) => {
    setCollected(prev => {
      const next = { ...prev };
      if (next[creatureId]) {
        delete next[creatureId];
      } else {
        next[creatureId] = true;
      }
      return next;
    });
  };

  const setMultiple = (creatureIds, value = true) => {
    setCollected(prev => {
      const next = { ...prev };
      for (const id of creatureIds) {
        if (value) {
          next[id] = true;
        } else {
          delete next[id];
        }
      }
      return next;
    });
  };

  const clearAll = () => setCollected({});

  return { collected, toggle, setMultiple, clearAll };
}
