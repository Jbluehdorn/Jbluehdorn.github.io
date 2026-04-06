import { useLocalStorage } from '../../../hooks/useLocalStorage'

// ACNH day rolls over at 5 AM
function getACNHDate(date) {
  const d = new Date(date || Date.now());
  if (d.getHours() < 5) {
    d.setDate(d.getDate() - 1);
  }
  return d.toISOString().split('T')[0];
}

const CHAT_KEY = 'acnh_villager_tracker_chats';
const HISTORY_DAYS = 30;

export function useChatTracker(currentDate) {
  const [chatHistory, setChatHistory] = useLocalStorage(CHAT_KEY, {});
  const today = getACNHDate(currentDate);

  const todayChats = chatHistory[today] || [];

  const hasChattedToday = (villagerName) => todayChats.includes(villagerName);

  const toggleChat = (villagerName) => {
    setChatHistory(prev => {
      const dayChats = prev[today] || [];
      const updated = dayChats.includes(villagerName)
        ? dayChats.filter(n => n !== villagerName)
        : [...dayChats, villagerName];

      const cutoff = new Date(currentDate || Date.now());
      cutoff.setDate(cutoff.getDate() - HISTORY_DAYS);
      const cutoffStr = cutoff.toISOString().split('T')[0];

      const cleaned = {};
      for (const [date, chats] of Object.entries(prev)) {
        if (date >= cutoffStr) cleaned[date] = chats;
      }
      cleaned[today] = updated;

      return cleaned;
    });
  };

  const getChatStreak = (villagerName) => {
    let streak = 0;
    const d = new Date(currentDate || Date.now());
    if (d.getHours() < 5) d.setDate(d.getDate() - 1);

    for (let i = 0; i < HISTORY_DAYS; i++) {
      const dateStr = d.toISOString().split('T')[0];
      const dayChats = chatHistory[dateStr] || [];
      if (dayChats.includes(villagerName)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const chattedCount = todayChats.length;

  return { hasChattedToday, toggleChat, getChatStreak, chattedCount, today };
}
