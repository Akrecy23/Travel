// THIS FILE CONTAINS CODE FOR TOGGLING BETWEEN YEAR DROPDOWN OPTIONS

// RUN FOLLOWING CODE WHEN WEBPAGE FIRST LOAD
document.addEventListener("HomeFrontLayoutReady", () => {
  // ======= SET REFERENCES =========
  const savedYear = localStorage.getItem("selectedYear");
  const yearButton = document.getElementById("year-button");

  // Default to saved year OR current year
  if (savedYear && savedYear.trim() !== "" && savedYear !== "undefined") {
    window.displayYear = savedYear;
  } else {
    window.displayYear = new Date().getFullYear().toString(); // current year
  }

  if (yearButton) {
    yearButton.textContent = `📌 ${window.displayYear} ▼`;
  }

  const yearMenu = document.getElementById("year-menu");
  if (!yearButton || !yearMenu) {
    console.warn("Dropdown elements not found. Layout may not be injected yet.");
    return;
  }

  // ======= ADD LISTENER FOR DROPDOWN LIST BEING CLICKED ========
  if (typeof loadYear === "function") {
    loadYear(); // Call function to load options
  }

  // ======= TOGGLE DROPDOWN VISIBILITY ========
  yearButton.addEventListener("click", (e) => {
    e.stopPropagation();
    yearMenu.style.display = yearMenu.style.display === "block" ? "none" : "block";
  });

  // Close dropdown when clicking outside
  window.addEventListener("click", (e) => {
    if (!yearButton.contains(e.target) && !yearMenu.contains(e.target)) {
      yearMenu.style.display = "none";
    }
  });
});

// ======= LOAD OPTIONS FROM FIRESTORE DATABASE ========
function loadYear() {
  if (!window.db) {
    console.error("Firestore not initialized");
    return;
  }
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }

  // Reference to dom elements
  const yearButton = document.getElementById("year-button");
  const yearMenu = document.getElementById("year-menu");
  yearMenu.innerHTML = ""; // Clear old options

  // ======= GET YEARS FROM FIRESTORE =========
  // Navigate to firestore "Trips"
  const tripsRef = window.db.collection("Trips");
  // Query trips where user is owner or collaborator
  const ownedQuery = tripsRef.where("ownerUid", "==", currentUserId);
  const collabQuery = tripsRef.where("collaborators", "array-contains", currentUserId);
  // Get a collection of unique years in each queried trips
  Promise.all([ownedQuery.get(), collabQuery.get()])
    .then(([ownedSnap, collabSnap]) => {
      const years = new Set();

      [ownedSnap, collabSnap].forEach(snap => {
        snap.forEach(doc => {
          const data = doc.data();
          if (data.year) years.add(data.year.toString());
        });
      });

      if (years.size === 0) return;

      // ====== POPULATE DROPDOWN LIST =======
      years.forEach(year_id => {
        const li = document.createElement("li");
        li.textContent = `📍 ${year_id}`;
        li.setAttribute("data-year", year_id);
        // Attach listeners to each option
        li.addEventListener("click", () => {
          yearMenu.style.display = "none";
          yearButton.textContent = `📌 ${year_id} ▼`;
          localStorage.setItem("selectedYear", year_id);
          // Fire event when user selects an option
          document.dispatchEvent(new CustomEvent("yearChanged", {
            detail: { year: year_id }
          }));
        });
        yearMenu.appendChild(li);
      });
    })
    .catch(error => {
      console.error("Error fetching years:", error);
    });
}