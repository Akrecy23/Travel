// THIS FILE IS PART 1 OF FOODDETAILS_CARD.JS
// 1. CONTAINS EVENT LISTENER & SETS DEFAULT VARIABLES
// 2. MAIN FUNCTION TO LOAD FOOD CARDS

// RUN FOLLOWING CODE WHEN THERE'S A SEARCH INPUT
document.addEventListener("SearchInputFilter", (e) => {
  const searchTerm = e.detail.searchInput;
  filterTrips(searchTerm, ".food-card", ".food-name");
});

// ========== EVENT LISTENERS =================
// RUN FOLLOWING CODE WHEN WEBPAGE FIRST LOAD
document.addEventListener("dropdownReady", () => {
  const selectedCountry = window.displayCountry || localStorage.getItem("selectedCountry");
  const selectedCity = window.selectedCities || "all";
  const selectedYear = window.selectedYears || "all";
  const selectedFoodType = window.selectedTypes || "all";
  const selectedStatus = window.selectedStatuses || "all";
  // =========== DISPLAY CARDS ============
  if (typeof loadFoodCards === "function") {
    loadFoodCards(selectedCountry, selectedCity, selectedYear, selectedFoodType, selectedStatus);
  }
});

// RUN FOLLOWING CODE WHEN COUNTRY CHANGED
document.addEventListener("countryChanged", () => {
  const selectedCountry = window.displayCountry || localStorage.getItem("selectedCountry");
  const selectedCity = window.selectedCities || "all";
  const selectedYear = window.selectedYears || "all";
  const selectedFoodType = window.selectedTypes || "all";
  const selectedStatus = window.selectedStatuses || "all";
  // =========== DISPLAY CARDS ============
  if (typeof loadFoodCards === "function") {
    loadFoodCards(selectedCountry, selectedCity, selectedYear, selectedFoodType, selectedStatus);
  }
});

// RUN FOLLOWING CODE WHEN FILTERS APPLIED CHANGED
document.addEventListener("filtersApplied", () => {
  const selectedCountry = window.displayCountry || localStorage.getItem("selectedCountry");
  const selectedCity = window.selectedCities || "all";
  const selectedYear = window.selectedYears || "all";
  const selectedFoodType = window.selectedTypes || "all";
  const selectedStatus = window.selectedStatuses || "all";

  // =========== DISPLAY CARDS ============
  if (typeof loadFoodCards === "function") {
    loadFoodCards(selectedCountry, selectedCity, selectedYear, selectedFoodType, selectedStatus);
  }
});

// ================= MAIN FUNCTION ===========================
// FUNCTION TO GET FOOD FOR SELECTED LOCATION
// THEN DISPLAY FOOD' DETAILS
async function loadFoodCards(country, city, year, actType, status) {
  if (!window.db) {
    console.error("Firestore not initialized");
    return;
  }
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }

  const grid = document.getElementById("foodGrid");
  if (!grid) return;
  grid.innerHTML = "";

  // ✅ Load Array_City once
  const arrayCityDoc = await window.db
    .collection("User").doc(currentUserId)
    .collection("Suggested Food").doc("Array_City")
    .get();

  const arrayCityData = arrayCityDoc.data() || {};
  const cityArrayKey = country + "Cities";
  const allCities = arrayCityData[cityArrayKey] || [];

  // ✅ Initialize cityGroups with ALL cities (even empty ones)
  window.cityGroups = {};
  
  const ignoreDocs = ["Array_City", "Array_Country", "Array_Year"];
  const snapshot = await window.db
    .collection("User").doc(currentUserId)
    .collection("Suggested Food")
    .get();
  snapshot.forEach(async doc => {
    if (ignoreDocs.includes(doc.id)) return; // skip array docs

    const data = doc.data();
    data.id = doc.id // Keep ID for editing later
    
    // Apply filters
    if (!matchesFilters(data, country, city, year, actType, status)){
      return;
    }

    // If fits, add to page
    const card = createFoodCard(data);
    // Ensure city exists in groups
    if (!window.cityGroups[data.City]) {
      window.cityGroups[data.City] = [];
    }
    window.cityGroups[data.City].push(card);
    attachFoodListeners(card, data, currentUserId, country, city, year, actType, status);
  });
  // Build grouped layout
  grid.innerHTML = "";
  const cityNames = Object.keys(window.cityGroups).filter(
    cityName => window.cityGroups[cityName].length > 0
  );
  if (cityNames.length === 0) {
    // ✅ No cards at all → show single "No results"
    const msg = document.createElement("div");
    msg.textContent = "No results";
    msg.className = "no-results";
    grid.appendChild(msg);
  } else {
    cityNames.sort().forEach(cityName => {
      const section = document.createElement("div");
      section.className = "city-section";
      section.dataset.city = cityName;
  
      const container = document.createElement("div");
      container.className = "city-food";
  
      window.cityGroups[cityName].forEach(card => container.appendChild(card));
  
      section.appendChild(container);
      grid.appendChild(section);
    });
  }

  // Reset for next load
  window.cityGroups = {};
  document.dispatchEvent(new CustomEvent("FoodCardsLoaded"));
}

function matchesFilters(data, country, city, year, actType, status) {
  // Country filter
  if (country !== "all" && data.Country !== country) {
    return false;
  }

  // City filter
  if (!city.includes("all") && !city.includes(data.City)) {
    return false;
  }

  // Year filter
  if (!year.includes("all") && !year.includes(data.YearAdded)) {
    return false;
  }

  // Food Type filter
  if (!actType.includes("all") && !actType.includes(data.Type)) {
    return false;
  }

  // Status filter
  if (!status.includes("all")) {
    const selected = status[0];
    if (selected === "Saved" && !data.Saved) return false;
    if (selected === "Revisit" && !data.Revisit) return false;
  }

  return true;
}

document.addEventListener("FoodCardsLoaded", () => {
  
  const header = document.getElementById("stickyCityHeader");
  const addBtn = document.getElementById("addFoodGlobalBtn");
  const sections = document.querySelectorAll(".city-section");
  const scrollArea = document.querySelector(".scroll-wrapper");

  if (!sections.length) {
    // No city sections → show default header
    header.textContent = "City";
    addBtn.dataset.city = "";
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const city = entry.target.dataset.city;
          header.textContent = city || "City";
          addBtn.dataset.city = city || "";
        }
      });
    },
    { root: scrollArea, threshold: 0.1 }
  );

  sections.forEach(section => observer.observe(section));
});
