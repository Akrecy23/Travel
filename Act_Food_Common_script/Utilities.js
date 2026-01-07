// ======== HELPER FUNCTION TO CLEAN TIME ============
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

// ===== HELPER FUNCTION TO CONVERT HH:MM AM/PM INTO HH:MM =========
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

// ======= HELPER FUNCTION FOR BADGE STATUS ===========
function updateStatusBadge(card, statusKey, isActive, label) {
  const badgesContainer = card.querySelector(".status-badges");
  if (!badgesContainer) return;
  // Remove existing badge of this type
  const existingBadge = badgesContainer.querySelector(`.badge-${statusKey}`);
  if (existingBadge) existingBadge.remove();
  // Add badge if active
  if (isActive) {
    const badge = document.createElement("span");
    badge.className = `badge badge-${statusKey}`;
    // Auto‑inject icon ✔ for revisit
    if (statusKey === "revisit") {
      badge.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        ${label}
      `;
    }
    else{
      badge.innerHTML = `${label}`;
    }
    badgesContainer.appendChild(badge);
  }
  // Update data-status attribute for filtering logic
  let statuses = card.getAttribute("data-status").split(" ");
  if (isActive && !statuses.includes(statusKey)) {
    statuses.push(statusKey);
  } else if (!isActive) {
    statuses = statuses.filter(s => s !== statusKey);
  }
  card.setAttribute("data-status", statuses.join(" ") || "unspecified");
}
