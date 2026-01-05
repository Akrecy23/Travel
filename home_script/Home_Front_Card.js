// =========== CREATE HOME FRONT CARDS LAYOUT ==========
document.addEventListener("HomeFrontLayoutReady", async () => {
  const hero_card = document.querySelector(".hero-card-container");
  if (!hero_card) return;

  // Replace hardcoded admin with CURRENT_UID
  console.log("home: ", window.CURRENT_UID);
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    console.warn("User not authenticated - cannot load trips");
    hero_card.innerHTML = `<p>Please log in to view your trips.</p>`;
    return;
  }

  const today = new Date();
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const currentCards = [];
  const upcomingCards = [];
  const pastCards = [];
  let upcomingCount = 0;
  let currentCount = 0;
  let pastCount = 0;

  // helper inside Home_Front_Card.js
  const formatMD = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  
  const buildDateRange = (start, end) => {
    const startMD = formatMD(start);
    const endMD = formatMD(end);
    const startY = start.getFullYear();
    const endY = end.getFullYear();
  
    if (startY === endY) {
      return `${startMD} - ${endMD}, ${startY}`;
    }
    return `${startMD}, ${startY} - ${endMD}, ${endY}`;
  };


  // ✅ Fetch trips the user owns or collaborates on for current + next year
  const tripsRef = window.db.collection("Trips");
  const ownedQuery = tripsRef.where("ownerUid", "==", currentUserId)
                             .where("year", "in", [currentYear, nextYear]);
  const collabQuery = tripsRef.where("collaboratorIds", "array-contains", currentUserId)
                              .where("year", "in", [currentYear, nextYear]);    

  const [ownedSnap, collabSnap] = await Promise.all([ownedQuery.get(), collabQuery.get()]);

  // Fetch ONLY this user's trips for current + next year
  const tripDocs = [];
  [ownedSnap, collabSnap].forEach(snap => {
    snap.forEach(doc => {
      const data = doc.data();
      tripDocs.push({
        tripId: doc.id,
        title: data.title,
        year: data.year,
        countryName: data.country,
        groupName: data.group,
        data
      });
    });
  });

  // Iterate all trips, extract Year/Country/Group/Trip from path
  for (const trip of tripDocs) {
    const { year, countryName, groupName,  tripId, title, data } = trip;

    const startDate = parseFirestoreDate(data.tripStartDate);
    const endDate = parseFirestoreDate(data.tripEndDate);
    if (!isValidDate(startDate) || !isValidDate(endDate)) continue;

    const { status, countdown } = getTripStatus(startDate, endDate);
    const card = {
      tripId: tripId,
      title: title,
      location: countryName,
      dateRange: buildDateRange(startDate, endDate),
      countdown,
      image: data.imageURL && data.imageURL.trim() !== ""
           ? data.imageURL
           : "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
      year,
      group: groupName,
      country: countryName,
      tripStartDate: startDate,
      tripEndDate: endDate
    };

    // Classify trip
    if (status === "current") {
      currentCount++;
      currentCards.push(card);
    } else if (status === "upcoming") {
      upcomingCount++;
      upcomingCards.push(card);
    } else if (status === "past") {
      pastCount++;
      pastCards.push(card);
    }
  }

  console.log("Current:", currentCount);
  console.log("Upcoming:", upcomingCount);
  console.log("Past:", pastCount);

  window.tripData = {
    current: currentCards,
    upcoming: upcomingCards,
    past: pastCards
  };

  window.tripStats = {
    upcoming: upcomingCount,
    current: currentCount,
    past: pastCount
  };

  // Sort upcoming trips by daysUntil ascending
  upcomingCards.sort((a, b) => {
    const daysA = parseInt(a.countdown);
    const daysB = parseInt(b.countdown);
    return daysA - daysB;
  });

  // Decide which cards to show
  let cardData = [];
  if (currentCards.length > 0 || upcomingCards.length > 0) {
    // Show current first, then upcoming
    cardData = [...currentCards, ...upcomingCards];
  } else {
    // If no current or upcoming, show past
    cardData = pastCards;
  }

  if (cardData.length === 0) {
    hero_card.innerHTML = `
      <p class="no-trips-text">
        No trips found for ${currentYear} and ${nextYear}.
      </p>
    `;
    return;
  }

  // Inject all cards into slider
  hero_card.innerHTML = `
    <button class="carousel-arrow left-arrow">‹</button>
    <div class="card-slider">
      ${cardData.map(card => `
        <div class="hero-card">
          <img src="${card.image}" 
             alt="${card.title}" 
             class="hero-image"
             onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80';">
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <h2 class="hero-title">${card.title}</h2>
            <div class="hero-details">
              <div class="hero-detail-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" 
                     stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                ${card.location}
              </div>
              <div class="hero-detail-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" 
                     stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                ${card.dateRange}
              </div>
            </div>
            <div class="countdown-badge">
              <div class="countdown-number">${card.countdown}</div>
              <div class="countdown-text">until departure</div>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
    <button class="carousel-arrow right-arrow">›</button>
  `;

  document.dispatchEvent(new Event("HomeCardsReady"));
});

function parseFirestoreDate(str) {
  if (!str) return new Date("Invalid");
  const cleaned = String(str).replace(/^[A-Za-z]+,\s*/, "");
  return new Date(cleaned);
}


function isValidDate(d) {
  return d instanceof Date && !isNaN(d.valueOf());
}

// Enable click-to-scroll after cards are rendered
document.addEventListener("HomeCardsReady", () => {
  const slider = document.querySelector(".card-slider");
  const cards = [...document.querySelectorAll(".hero-card")];
  const leftArrow = document.querySelector(".left-arrow");
  const rightArrow = document.querySelector(".right-arrow");

  const scrollToCard = (index) => {
    const card = cards[index];
    if (!card) return;
    slider.scrollTo({
      left: card.offsetLeft - (slider.clientWidth - card.clientWidth) / 2,
      behavior: "smooth"
    });
  };

  const getCurrentIndex = () => {
    const scroll = slider.scrollLeft;
    let closest = 0;
    let minDist = Infinity;

    cards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft - scroll);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });

    return closest;
  };

  leftArrow.addEventListener("click", () => {
    const current = getCurrentIndex();
    scrollToCard(current - 1);
  });

  rightArrow.addEventListener("click", () => {
    const current = getCurrentIndex();
    scrollToCard(current + 1);
  });
});

document.addEventListener("HomeCardsReady", () => {
  const viewAllLink = document.querySelector(".view-all-link .link-btn");

  if (viewAllLink) {
    viewAllLink.addEventListener("click", (e) => {
      e.preventDefault(); // prevent the # from jumping the page
      // ✅ Activate the All Trips toggle visually
      const toggleBtns = document.querySelectorAll(".toggle-btn");
      toggleBtns.forEach(b => b.classList.remove("active"));

      const allTripsBtn = [...toggleBtns].find(b =>
        b.textContent.includes("All Trips")
      );
      if (allTripsBtn) {
        allTripsBtn.classList.add("active");
      }
      document.dispatchEvent(new Event("CreateHomeBackLayout"));
    });
  }
});





