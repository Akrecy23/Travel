// THIS FILE CONTAINS CODE FOR TOGGLING BETWEEN DROPDOWN OPTIONS

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

  const yearButton = document.getElementById("year-button");
  const yearMenu = document.getElementById("year-menu");
  yearMenu.innerHTML = ""; // Clear old options

  window.db.collection("User").doc(currentUserId)
    .collection("Year").get()
    .then(snapshot => {
      if (snapshot.empty) return;

      snapshot.forEach(doc => {
        const year_id = doc.id; // Use doc.id instead of doc.data()

        const li = document.createElement("li");
        li.textContent = `📍 ${year_id}`;
        li.setAttribute("data-year", year_id);

        li.addEventListener("click", () => {
          yearMenu.style.display = "none";
          yearButton.textContent = `📌 ${year_id} ▼`;
          localStorage.setItem("selectedYear", year_id);

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