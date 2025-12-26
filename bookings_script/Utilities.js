// THIS FILE CONTAINS ALL THE HELPER FUNCTIONS

// Helper: Calculate duration from "hh:mm AM/PM" strings
function calculateDuration(departureDate, departureTime, arrivalDate, arrivalTime) {
  if (!departureDate || !departureTime || !arrivalDate || !arrivalTime) return null;
  try {
    // Build full Date objects
    const depart = new Date(`${departureDate} ${departureTime}`);
    const arrive = new Date(`${arrivalDate} ${arrivalTime}`);

    if (arrive <= depart) return null;

    const diffMs = arrive - depart;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(diffMinutes / (60 * 24));
    const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
    const minutes = diffMinutes % 60;

    // Only show days if > 24 hours
    let result = "";
    if (diffMinutes > 24 * 60) {
      if (days > 0) result += `${days}d `;
      if (hours > 0 || days > 0) result += `${hours}h `;
      result += `${minutes}m`;
    } else {
      result = `${hours}h ${minutes}m`;
    }

    return result.trim();
  } catch (err) {
    console.error("Error calculating duration:", err);
    return null;
  }
}

  // Helper: Convert "hh:mm AM/PM" into a Date object
  function parseTimeString(timeStr) {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier.toUpperCase() === "PM" && hours < 12) {
      hours += 12;
    }
    if (modifier.toUpperCase() === "AM" && hours === 12) {
      hours = 0;
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  // Helper function to calculate nights
  function calculateNights(checkIn, checkOut) {
    if (!checkIn || !checkOut) return null;
    try {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : null;
    } catch {
      return null;
    }
  }

  // Helper function to get emoji for booking type
  function getTypeEmoji(type) {
    const typeMap = {
      'ticket': '🎫',
      'attraction': '🎫',
      'tour': '🚌',
      'transport': '🚗',
      'train': '🚄',
      'bus': '🚌',
      'rental': '🚗',
      'default': '📄'
    };
    const key = type.toLowerCase();
    return typeMap[key] || typeMap.default;
  }


// Format "xxxxxx, mmm dd, yyyy" to Date input
function toDateInputValue(originalDateStr) {
  // Parse the human-readable date string
  const date = new Date(originalDateStr);

  // Format to YYYY-MM-DD for <input type="date">
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Format Date input to "xxxxxx, mmm dd, yyyy"
function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",   // Thursday
    month: "short",    // Dec
    day: "2-digit",    // 11
    year: "numeric"    // 2025
  });
}

// Format "xxxxxx, mmm dd, yyyy" to mmm dd
function formatSimpleDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr); // works with "Thursday, Jan 01, 2026"
  return date.toLocaleDateString("en-US", {
    month: "short", // Jan
    day: "2-digit"  // 01
  });
}

// Convert hh:mm AM/PM into HH:mm
function toTimeInputValue(timeStr) {
  if (!timeStr) return "";

  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier.toUpperCase() === "PM" && hours < 12) {
    hours += 12;
  }
  if (modifier.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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

// Special Format for "Other Bookings" Time
function validateOtherBookingTime(inputEl, ogTime) {
  const value = inputEl.value.trim();

  // Regex for single time (hh:mm AM/PM)
  const singleTimeRegex = /^([1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

  // Regex for range (hh:mm AM/PM - hh:mm AM/PM)
  const rangeRegex = /^([1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)\s*-\s*([1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

  // Decide which regex to use based on spaces/dash
  let isValid = false;
  if (value.includes("-")) {
    // treat as range
    isValid = rangeRegex.test(value);
  } else {
    // treat as single time
    isValid = singleTimeRegex.test(value);
  }

  if (isValid) {
    inputEl.classList.remove("invalid");
    return true;
  } else {
    inputEl.value = ogTime || "";
    inputEl.classList.add("invalid");
    alert("Please enter time as 'hh:mm AM/PM' or 'hh:mm AM/PM - hh:mm AM/PM'");
    return false;
  }
}

// Helper to map Mode to emoji + text
function getModeDisplay(mode) {
  const map = {
    Airplane: "✈️",
    Ferry: "⛴️",
    Others: "🚗"
  };
  return map[mode] || "❓ Unknown";
}




