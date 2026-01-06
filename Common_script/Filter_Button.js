// THIS SCRIPT CONTAINS CODE FOR FILTERING LOGIC 

// =========== CREATE FILTER SECTION WHEN LAYOUT IS READY =============
document.addEventListener("dropdownReady", () => {
  // Reference to dom elements
  const filterModal = document.getElementById("filterModal");
  if (!filterModal) return;
  // Inject filter modal content
  filterModal.innerHTML = `
    <div class="filter-panel">
      <div class="filter-body">
        <!-- Left column: category labels -->
        <div class="filter-left">
          <div class="filter-category">Country</div>
          <div class="manual-divider"></div>
          <div class="filter-category">Group</div>
          <!-- Add more categories here -->
        </div>
        <!-- Right column: options grouped by category -->
        <div class="filter-right">
          <div class="filter-section">
            <div class="filter-header">Country</div>
            <div class="filter-options"></div>
            <div class="show-more">Show more</div>
          </div>
          <div class="manual-divider"></div>
          <div class="filter-section">
            <div class="filter-header">Group</div>
            <div class="filter-options"></div>
            <div class="show-more">Show more</div>
          </div>
        </div>
      </div>
      <!-- Bottom actions -->
      <div class="modal-actions">
        <button id="resetFilters" class="modal-btn reset">Reset</button>
        <button id="applyFilters" class="modal-btn apply">Apply</button>
      </div>
    </div>
  `;
  // Show modal when user clicks on filter icon
  const filterBtn = document.getElementById("filterToggle");
    if (filterBtn) {
      filterBtn.addEventListener("click", () => {
      filterModal.classList.toggle("visible");
      if (filterModal.classList.contains("visible")) {
        initialiseFilters();   // ✅ refresh pills on open
      }
    });
  }
  document.querySelectorAll(".filter-category").forEach(cat => {
    cat.addEventListener("click", () => {
      const filterBody = document.querySelector(".filter-body");
      const targetSection = [...document.querySelectorAll(".filter-section")]
        .find(sec => sec.querySelector(".filter-header")?.textContent === cat.textContent);
      
      if (targetSection && filterBody) {
        const rect = targetSection.getBoundingClientRect();
        const containerRect = filterBody.getBoundingClientRect();
      
        const fullyVisible =
          rect.top >= containerRect.top &&
          rect.bottom <= containerRect.bottom;
      
        if (!fullyVisible) {
          const maxScroll = filterBody.scrollHeight - filterBody.clientHeight;
          const targetTop = targetSection.offsetTop;
      
          filterBody.scrollTo({
            top: Math.min(targetTop, maxScroll),
            behavior: "smooth"
          });
      
          targetSection.classList.add("highlight");
          setTimeout(() => targetSection.classList.remove("highlight"), 1500);
        }
      }
    });
  });
  // Close modal when clicking outside panel
  filterModal.addEventListener("click", (e) => {
    if (e.target === filterModal) {
      filterModal.classList.remove("visible");
    }
  });
});

// =========== CREATE FILTER SECTION WHEN YEAR IS CHANGED =============
document.addEventListener("yearChanged", (e) => {
    // Reset year variable
    localStorage.setItem("selectedYear", e.detail.year);
    window.displayYear = e.detail.year;
    // Reset filters
    window.selectedCountries = "all";
    window.selectedGroups = "all";
    initialiseFilters();
});

// ========= POPULATE FILTER OPTIONS & ATTACH LISTENERS ==========
function initialiseFilters() {
  // ======= CHECK EVERYTHING IS READY & VALID ======
  // Check for authenticated user
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }
  // Check for dom elements
  const filterModal = document.getElementById("filterModal");
  if (!filterModal) return;
  // Check for firestore connection
  if (!window.db) {
    console.error("Firestore not initialized");
    return;
  }

  // Reference to dom elements
  const filterOptionsBlocks = filterModal.querySelectorAll(".filter-options");
  const countryOptions = filterOptionsBlocks[0];
  const groupOptions = filterOptionsBlocks[1];

  // Clear both sections of filters
  countryOptions.innerHTML = "";
  groupOptions.innerHTML = "";

  // ======= POPULATE COUNTRY & GROUP DATA FROM FIRESTORE ========
  // Navigate to Firestore "Trips"
  const tripsRef = window.db.collection("Trips");
  // Change year type from string to number
  const yearNum = parseInt(window.displayYear, 10);
  // Query Owned/Collaborated Trips
  const ownedQuery = tripsRef.where("year", "==", yearNum)
                             .where("ownerUid", "==", currentUserId);
  const collabQuery = tripsRef.where("year", "==", yearNum)
                              .where("collaboratorIds", "array-contains", currentUserId);
  Promise.all([ownedQuery.get(), collabQuery.get()])
    .then(([ownedSnap, collabSnap]) => {
      const countries = new Set();
      const groups = new Set();
      // Merge results & get collections of unique countries + groups
      [ownedSnap, collabSnap].forEach(snap => {
        snap.forEach(doc => {
          const data = doc.data();
          if (data.country) countries.add(data.country);
          if (data.group) groups.add(data.group);
        });
      });

      // Populate country pills
      countries.forEach(countryName => {
        const btn = document.createElement("button");
        btn.className = "filter-pill";
        btn.textContent = countryName;
        if (Array.isArray(window.selectedCountries) && window.selectedCountries.includes(countryName)) {
          btn.classList.add("active");
        }
        // Attach listener to country options
        btn.addEventListener("click", () => {
          // Remove highlight if user click to "clear"
          if (btn.classList.contains("active")) {
            btn.classList.remove("active");
            return;
          }
          btn.classList.add("active");
        });
        countryOptions.appendChild(btn);
      });
      setupShowMore(countryOptions.closest(".filter-section"));

      // Populate group pills
      groups.forEach(groupName => {
        const gbtn = document.createElement("button");
        gbtn.className = "filter-pill";
        gbtn.textContent = groupName;
        if (Array.isArray(window.selectedGroups) && window.selectedGroups.includes(groupName)) {
          gbtn.classList.add("active");
        }
        // Attach listener to group options
        gbtn.addEventListener("click", () => {
          // Remove highlight if user click to "clear"
          if (gbtn.classList.contains("active")) {
            gbtn.classList.remove("active");
            return;
          }
          gbtn.classList.add("active");
        });
        groupOptions.appendChild(gbtn);
      });
      setupShowMore(groupOptions.closest(".filter-section"));
    });

  // Reference Reset & Apply dom elements
  const resetBtn = filterModal.querySelector("#resetFilters");
  const applyBtn = filterModal.querySelector("#applyFilters");
  let resetPending = false;

  // ========= ATTACH RESET LOGIC ========
  resetBtn.onclick = () => {
    resetPending = true;
    // Clear all filters
    countryOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    groupOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
  };
  // ========= ATTACH APPLY LOGIC ========
  applyBtn.onclick = () => {
    if (resetPending){
      window.selectedCountries = ["all"];
      window.selectedGroups = ["all"];
      resetPending = false;
    } else{
      // Store selected options
      const activeCountries = [...countryOptions.querySelectorAll(".filter-pill.active")];
      const activeGroups = [...groupOptions.querySelectorAll(".filter-pill.active")];
      window.selectedCountries = activeCountries.length ? activeCountries.map(btn => btn.textContent) : ["all"];
      window.selectedGroups = activeGroups.length ? activeGroups.map(btn => btn.textContent) : ["all"];
    }
    // Fire event when filters has been applied
    document.dispatchEvent(new CustomEvent("filtersApplied", {}));
    filterModal.classList.remove("visible");
  };
}

// ================= SHOW MORE / SHOW LESS HANDLER =================
const BATCH_SIZE = 4; // or any number you want

function setupShowMore(sectionElement) {
  let pills = [...sectionElement.querySelectorAll(".filter-pill")];
  const showMoreBtn = sectionElement.querySelector(".show-more");

  // Reorder pills: active first, then inactive
  const container = sectionElement.querySelector(".filter-options");
  pills
    .sort((a, b) => b.classList.contains("active") - a.classList.contains("active"))
    .forEach(pill => container.appendChild(pill)); // re-append in new order

  if (!showMoreBtn || pills.length <= BATCH_SIZE) {
    showMoreBtn.style.display = "none";
    return;
  }

  let visibleCount = BATCH_SIZE;

  // Pre-hide pills to prevent layout shift
  pills.forEach((pill, index) => {
    pill.style.visibility = index < visibleCount ? "visible" : "hidden";
  });

  requestAnimationFrame(() => {
    pills.forEach((pill, index) => {
      pill.style.visibility = "visible";
      pill.style.display = index < visibleCount ? "inline-flex" : "none";
    });
  });

  function updateView() {
    pills.forEach((pill, index) => {
      pill.style.display = index < visibleCount ? "inline-flex" : "none";
    });

    showMoreBtn.textContent =
      visibleCount >= pills.length ? "Show less" : "Show more";

    showMoreBtn.style.display =
      pills.length > BATCH_SIZE ? "block" : "none";
  }

  showMoreBtn.onclick = () => {
    visibleCount =
      visibleCount >= pills.length ? BATCH_SIZE : visibleCount + BATCH_SIZE;
    updateView();
  };
}














