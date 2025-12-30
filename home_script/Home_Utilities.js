// Helper: format a date string like "Mar 12, 2026" into "Thursday, Mar 12, 2026"
function formatDateString(dateStr) {
  const parsed = new Date(dateStr);
  if (isNaN(parsed)) return dateStr; // fallback
  const options = { weekday: "long", month: "short", day: "numeric", year: "numeric" };
  return parsed.toLocaleDateString("en-US", options);
}

// Parse "Mar 12 - Mar 18, 2026" into start/end
// Parse "Dec 28, 2025 - Jan 2, 2026" or "Dec 28 - Jan 2, 2025"
function parseDateRange(rangeStr) {
  try {
    const [startPart, endPart] = rangeStr.split("-");
    const trailingYearMatch = rangeStr.match(/(\d{4})\s*$/);
    const trailingYear = trailingYearMatch ? parseInt(trailingYearMatch[1], 10) : undefined;

    const startYearMatch = startPart.match(/(\d{4})/);
    const endYearMatch = endPart.match(/(\d{4})/);

    const startYear = startYearMatch ? parseInt(startYearMatch[1], 10) : trailingYear;
    let endYear = endYearMatch ? parseInt(endYearMatch[1], 10) : trailingYear;

    const startMD = startPart.replace(/,\s*\d{4}/, "").trim();
    const endMD = endPart.replace(/,\s*\d{4}/, "").trim();

    if (!endYear && startYear) endYear = startYear;

    let startStr = `${startMD}, ${startYear}`;
    let endStr = `${endMD}, ${endYear}`;

    let startParsed = new Date(startStr);
    let endParsed = new Date(endStr);

    // If only one year was given and end < start, bump end year
    if (!endYearMatch && startParsed && endParsed && endParsed < startParsed) {
      endYear = startYear + 1;
      endStr = `${endMD}, ${endYear}`;
      endParsed = new Date(endStr);
    }

    return {
      tripStartDate: formatDateString(startStr),
      tripEndDate: formatDateString(endStr)
    };
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

