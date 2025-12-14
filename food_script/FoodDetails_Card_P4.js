// HELPER: Capitalize filter key
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// CLEAN FORMAT OF TIME (e.g. 9am --> 9:00 AM)
function formatTimeInput(raw) {
  if (!raw) return "";

  let str = raw.trim().toLowerCase();

  // If user types "9am" or "930am"
  const match = str.match(/^(\d{1,2})(:?(\d{2}))?\s*(am|pm)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    let minutes = match[3] ? parseInt(match[3], 10) : 0;
    let suffix = match[4] ? match[4].toUpperCase() : (hours < 12 ? "AM" : "PM");

    // Normalize hours
    if (hours === 0) hours = 12;
    if (hours > 12) {
      hours = hours - 12;
      suffix = "PM";
    }

    // Pad minutes
    const minStr = minutes.toString().padStart(2, "0");

    return `${hours}:${minStr} ${suffix}`;
  }

  // If already in HH:MM AM/PM format, just clean spacing
  const regex = /^([0-9]{1,2}:[0-9]{2})\s?(AM|PM)$/i;
  if (regex.test(str)) {
    const [time, suffix] = str.split(/\s+/);
    return `${time} ${suffix.toUpperCase()}`;
  }

  // Fallback: return raw string
  return raw;
}