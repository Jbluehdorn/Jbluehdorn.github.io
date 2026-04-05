/**
 * Check if a creature is available based on date, time, and hemisphere.
 */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function isAvailableNow(creature, date, hemisphere) {
  const month = date.getMonth() + 1; // 1-12
  const hour = date.getHours(); // 0-23

  const monthsAvailable = hemisphere === 'north'
    ? creature.timeOfYear?.north
    : creature.timeOfYear?.south;

  if (!monthsAvailable || monthsAvailable.length === 0) return false;
  if (!monthsAvailable.includes(month)) return false;

  return isTimeAvailable(creature.timeOfDay, hour);
}

export function isTimeAvailable(timeOfDay, hour) {
  if (!timeOfDay || timeOfDay.allDay) return true;

  const { start, end } = timeOfDay;

  if (start < end) {
    // Normal range (e.g., 4 AM to 9 PM = 4 to 21)
    return hour >= start && hour < end;
  } else {
    // Wrapping range (e.g., 9 PM to 4 AM = 21 to 4)
    return hour >= start || hour < end;
  }
}

export function isAvailableThisMonth(creature, month, hemisphere) {
  const monthsAvailable = hemisphere === 'north'
    ? creature.timeOfYear?.north
    : creature.timeOfYear?.south;

  if (!monthsAvailable || monthsAvailable.length === 0) return false;
  return monthsAvailable.includes(month);
}

export function formatTimeOfDay(timeOfDay) {
  if (!timeOfDay || timeOfDay.allDay) return 'All day';
  return formatHour(timeOfDay.start) + ' – ' + formatHour(timeOfDay.end);
}

function formatHour(h) {
  if (h === 0 || h === 24) return '12 AM';
  if (h === 12) return '12 PM';
  if (h < 12) return h + ' AM';
  return (h - 12) + ' PM';
}

export function formatMonths(months) {
  if (!months || months.length === 0) return 'Unknown';
  if (months.length === 12) return 'All year';
  
  // Find contiguous ranges
  const ranges = [];
  let rangeStart = months[0];
  let prev = months[0];
  
  for (let i = 1; i <= months.length; i++) {
    const current = months[i];
    // Check if we wrapped around (e.g., 11, 12, 1, 2)
    if (current !== undefined && (current === prev + 1 || (prev === 12 && current === 1))) {
      prev = current;
    } else {
      ranges.push(rangeStart === prev
        ? MONTH_NAMES[rangeStart - 1]
        : MONTH_NAMES[rangeStart - 1] + ' – ' + MONTH_NAMES[prev - 1]
      );
      rangeStart = current;
      prev = current;
    }
  }
  
  return ranges.join(', ');
}

export function getAvailabilityStatus(creature, currentDate, hemisphere) {
  const month = currentDate.getMonth() + 1;
  const hour = currentDate.getHours();
  
  const monthsAvailable = hemisphere === 'north'
    ? creature.timeOfYear?.north
    : creature.timeOfYear?.south;

  if (!monthsAvailable || monthsAvailable.length === 0) return 'unknown';
  
  const availableThisMonth = monthsAvailable.includes(month);
  const availableNow = availableThisMonth && isTimeAvailable(creature.timeOfDay, hour);

  if (availableNow) return 'available-now';
  if (availableThisMonth) return 'available-later';

  // Check if leaving soon (available this month but not next)
  const nextMonth = (month % 12) + 1;
  if (availableThisMonth && !monthsAvailable.includes(nextMonth)) return 'leaving-soon';

  return 'unavailable';
}
