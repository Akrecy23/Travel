// Helper: format a date string like "Mar 12, 2026" into "Thursday, Mar 12, 2026"
function formatDateString(dateStr) {
  const parsed = new Date(dateStr);
  if (isNaN(parsed)) return dateStr; // fallback
  const options = { weekday: "long", month: "short", day: "numeric", year: "numeric" };
  return parsed.toLocaleDateString("en-US", options);
}

// Parse "Mar 12 - Mar 18, 2026" into start/end
function parseDateRange(rangeStr) {
  try {
    const [startPart, endPart] = rangeStr.split("-");
    const year = rangeStr.match(/\d{4}/)[0];
    const startDate = formatDateString(startPart.trim() + " " + year);
    const endDate = formatDateString(endPart.trim());
    return { tripStartDate: startDate, tripEndDate: endDate };
  } catch {
    return { tripStartDate: rangeStr, tripEndDate: "" };
  }
}

function getTripStatus(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start) || isNaN(end)) {
    return { status: "unknown", countdown: "" };
  }

  // ✅ Today in Singapore (but we only read Y/M/D)
  const todaySG = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" })
  );

  // ✅ Extract Y/M/D only (ignore time completely)
  const toNum = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

  const todayNum = toNum(todaySG);
  const startNum = toNum(start);
  const endNum = toNum(end);

  // ✅ Past trip
  if (endNum < todayNum) {
    return { status: "past", countdown: "Trip ended" };
  }

  // ✅ Current trip (inclusive)
  if (startNum <= todayNum && todayNum <= endNum) {
    if (todayNum === startNum) {
      return { status: "current", countdown: "Starts today" };
    }
    if (todayNum === endNum) {
      return { status: "current", countdown: "Ends today" };
    }
    return { status: "current", countdown: "Ongoing now" };
  }
// ✅ Upcoming trip
  const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const todayDateOnly = new Date(todaySG.getFullYear(), todaySG.getMonth(), todaySG.getDate());

  const diff = Math.ceil(
    (startDateOnly - todayDateOnly) / (1000 * 60 * 60 * 24)
  );

  return {
    status: "upcoming",
    countdown: `${diff} day${diff > 1 ? "s" : ""} till departure`
  };
}
