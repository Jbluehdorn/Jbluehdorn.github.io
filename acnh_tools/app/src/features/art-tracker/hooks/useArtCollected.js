import { useLocalStorage } from '../../../hooks/useLocalStorage'

const STORAGE_KEY = 'acnh_art_collected';

export function useArtCollected() {
  const [collected, setCollected] = useLocalStorage(STORAGE_KEY, []);

  const isCollected = (name) => collected.includes(name);

  const toggle = (name) => {
    setCollected(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  return { collected, isCollected, toggle, count: collected.length };
}
