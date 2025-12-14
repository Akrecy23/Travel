// THIS FILE IS PART 1 OF ACTIVITYDETAILS_CARD.JS
// 1. CONTAINS EVENT LISTENER & SETS DEFAULT VARIABLES
// 2. MAIN FUNCTION TO LOAD ACTIVITY CARDS

// RUN FOLLOWING CODE WHEN THERE'S A SEARCH INPUT
document.addEventListener("SearchInputFilter", (e) => {
  const searchTerm = e.detail.searchInput;
  filterTrips(searchTerm, ".activity-card", ".activity-name");
});

// ========== EVENT LISTENERS =================
// RUN FOLLOWING CODE WHEN WEBPAGE FIRST LOAD
document.addEventListener("filtersReady", () => {
  const selectedYear = window.displayYear || new Date().getFullYear().toString();
  const selectedCountry = window.selectedCountry || "all";
  const selectedActivityType = window.selectedType || "all";
  const selectedStatus = window.selectedStatus || "all";

  // =========== DISPLAY CARDS ============
  if (typeof loadActivityCards === "function") {
    loadActivityCards(selectedYear, selectedCountry, selectedActivityType, selectedStatus);
  }
});

// RUN FOLLOWING CODE WHEN FILTERS APPLIED CHANGED
document.addEventListener("filtersApplied", () => {
  const selectedYear = window.displayYear || new Date().getFullYear().toString();
  const selectedCountry = window.selectedCountry || "all";
  const selectedActivityType = window.selectedType || "all";
  const selectedStatus = window.selectedStatus || "all";

  // =========== DISPLAY CARDS ============
  if (typeof loadActivityCards === "function") {
    loadActivityCards(selectedYear, selectedCountry, selectedActivityType, selectedStatus);
  }
});

// ================= MAIN FUNCTION ===========================
// FUNCTION TO GET ACTIVITIES FOR SELECTED LOCATION
// THEN DISPLAY ACTIVITIES' DETAILS
async function loadActivityCards(yearId, countryId, actTypeId, statusId) {
  if (!window.db) {
    console.error("Firestore not initialized");
    return;
  }
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }

  const grid = document.getElementById("activitiesGrid");
  if (!grid) return;
  grid.innerHTML = "";

  try {
    async function processCountry(countryDoc) {
      const countryName = countryDoc.id;

      // Wrapper for this country
      const section = document.createElement("div");
      section.className = "country-section";

      // Header
      const header = document.createElement("h2");
      header.className = "country-header";
      header.textContent = countryName;
      section.appendChild(header);

      // Cards container
      const cardsContainer = document.createElement("div");
      cardsContainer.className = "country-cards";
      section.appendChild(cardsContainer);

      // Suggested Activities → Category
      const suggestedRef = countryDoc.ref.collection("Suggested Activities");
      const categoryDoc = await suggestedRef.doc("Category").get();
      if (!categoryDoc.exists) return;

      const categoryRef = categoryDoc.ref;

      if (actTypeId !== "all") {
        const subSnap = await categoryRef.collection(actTypeId).get();
        if (!subSnap.empty) {
          // ✅ append cards into cardsContainer, not grid
          await handleActivities(subSnap, cardsContainer, statusId, actTypeId, currentUserId, yearId, countryName);
        }
      } else {
        const activityTypesSnap = await window.db.collection("ActivityType").get();
        for (const typeDoc of activityTypesSnap.docs) {
          const typeName = typeDoc.id;
          const subSnap = await categoryRef.collection(typeName).get();
          if (!subSnap.empty) {
            // ✅ append cards into cardsContainer, not grid
            await handleActivities(subSnap, cardsContainer, statusId, typeName, currentUserId, yearId, countryName);
          }
        }
      }
      // Add "Add New Food" Button
      const addCard = document.createElement("div");
      addCard.className = "add-activity-card";
      addCard.dataset.country = countryName; // keep track of which country
      addCard.innerHTML = `
        <div class="add-content">
          <button class="add-activity-btn">➕ Add New Activity</button>
        </div>
      `;
      cardsContainer.appendChild(addCard);
      grid.appendChild(section);
    }

    if (countryId !== "all") {
      const countryDoc = await window.db
        .collection("User").doc(currentUserId)
        .collection("Year").doc(yearId)
        .collection("Country").doc(countryId)
        .get();
      if (countryDoc.exists) await processCountry(countryDoc);
    } else {
      const countriesSnap = await window.db
        .collection("User").doc(currentUserId)
        .collection("Year").doc(yearId)
        .collection("Country").get();
      for (const countryDoc of countriesSnap.docs) {
        await processCountry(countryDoc);
      }
    }
    // Fallback message if no results
    if (grid.querySelectorAll(".activity-card").length === 0) {
      const msg = document.createElement("div");
      msg.textContent = "No results";
      msg.className = "no-results"; // style via CSS
      grid.appendChild(msg);
    }
    document.dispatchEvent(new CustomEvent("ActivityCardsLoaded"));
  } catch (err) {
    console.error("Error loading activities:", err);
  }
}