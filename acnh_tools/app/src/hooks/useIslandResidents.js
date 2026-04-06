import { useLocalStorage } from './useLocalStorage'

const STORAGE_KEY = 'acnh_island_residents'
const MAX_RESIDENTS = 10

export function useIslandResidents() {
  const [residents, setResidents] = useLocalStorage(STORAGE_KEY, [])

  const addResident = (villagerName) => {
    setResidents(prev => {
      if (prev.length >= MAX_RESIDENTS) return prev
      if (prev.includes(villagerName)) return prev
      return [...prev, villagerName]
    })
  }

  const removeResident = (villagerName) => {
    setResidents(prev => prev.filter(n => n !== villagerName))
  }

  const isResident = (villagerName) => residents.includes(villagerName)

  return {
    residents,
    addResident,
    removeResident,
    isResident,
    isFull: residents.length >= MAX_RESIDENTS,
    count: residents.length,
    maxResidents: MAX_RESIDENTS,
  }
}
