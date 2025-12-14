
// =========== CREATE FILTER SECTION WHEN LAYOUT IS READY =============
document.addEventListener("HomeFrontLayoutReady", () => {
  console.log(window.displayYear);
  const filterModal = document.getElementById("filterModal");
  if (!filterModal) return;
  // Inject Shopee-style modal content
  filterModal.innerHTML = `
    <div class="filter-panel">
      <div class="filter-body">
        <!-- Left column: category labels -->
        <div class="filter-left">
          <div class="filter-category">Country</div>
          <!-- Add more categories here -->
          <!-- Conditionally add Activity Type -->
          ${window.location.pathname.endsWith("activities.html") ? `
            <div class="manual-divider"></div>
            <div class="filter-category">Activity Type</div>
            <div class="manual-divider"></div>
            <div class="filter-category">Status</div>
          ` : window.location.pathname.endsWith("food.html") ? `
            <div class="manual-divider"></div>
            <div class="filter-category">Food Type</div>
            <div class="manual-divider"></div>
            <div class="filter-category">Status</div>
          ` : `
            <div class="manual-divider"></div>
            <div class="filter-category">Group</div>
          `}
        </div>
        <!-- Right column: options grouped by category -->
        <div class="filter-right">
          <div class="filter-section">
            <div class="filter-header">Country</div>
            <div class="filter-options"></div>
            <div class="show-more">Show more</div>
          </div>
          ${window.location.pathname.endsWith("activities.html") ? `
            <div class="manual-divider"></div>
            <div class="filter-section">
              <div class="filter-header">Activity Type</div>
              <div class="filter-options"></div>
              <div class="show-more">Show more</div>
            </div>
            <div class="manual-divider"></div>
            <div class="filter-section">
              <div class="filter-header">Status</div>
              <div class="filter-options"></div>
            </div>
          ` : window.location.pathname.endsWith("food.html") ? `
            <div class="manual-divider"></div>
            <div class="filter-section">
              <div class="filter-header">Food Type</div>
              <div class="filter-options"></div>
            </div>
            <div class="manual-divider"></div>
            <div class="filter-section">
              <div class="filter-header">Status</div>
              <div class="filter-options"></div>
            </div>
          ` : `
            <div class="manual-divider"></div>
            <div class="filter-section">
              <div class="filter-header">Group</div>
              <div class="filter-options"></div>
              <div class="show-more">Show more</div>
            </div>
          `}
        </div>
      </div>
      <!-- Bottom actions -->
      <div class="modal-actions">
        <button id="resetFilters" class="modal-btn reset">Reset</button>
        <button id="applyFilters" class="modal-btn apply">Apply</button>
      </div>
    </div>
  `;
  // Show modal on filter icon click
  const filterBtn = document.getElementById("filterToggle");
    if (filterBtn) {
      filterBtn.addEventListener("click", () => {
      filterModal.classList.toggle("visible");
    });
  }
  // Close modal when clicking outside panel
  filterModal.addEventListener("click", (e) => {
    if (e.target === filterModal) {
      filterModal.classList.remove("visible");
    }
  });
  // Initialise filters
  initialiseFilters();
});

// =========== CREATE FILTER SECTION WHEN YEAR IS CHANGED =============
document.addEventListener("yearChanged", (e) => {
    // Reset year variable
    localStorage.setItem("selectedYear", e.detail.year);
    window.displayYear = e.detail.year;
    // Reset filters
    window.selectedCountry = "all";
    window.selectedGroup = "all";
    initialiseFilters();
});

// ========= POPULATE FILTER OPTIONS & ATTACH LISTENERS ==========
function initialiseFilters() {
  const currentUserId = window.CURRENT_UID;
  if (!currentUserId) {
    alert("You must be logged in to add a trip.");
    return;
  }
  console.log(window.displayYear);

  const filterModal = document.getElementById("filterModal");
  if (!filterModal) return;

  if (!window.db) {
    console.error("Firestore not initialized");
    return;
  }

  const filterOptionsBlocks = filterModal.querySelectorAll(".filter-options");
  const countryOptions = filterOptionsBlocks[0];

  let groupOptions = null;
  let typeOptions = null;
  let statusOptions = null;
  if (window.location.pathname.endsWith("activities.html")) {
    groupOptions = null;
    typeOptions = filterOptionsBlocks[1]; // Activity Type
    statusOptions = filterOptionsBlocks[2];
  } else if (window.location.pathname.endsWith("food.html")) {
    groupOptions = null;
    typeOptions = filterOptionsBlocks[1]; // Food Type
    statusOptions = filterOptionsBlocks[2];
  } else {
    groupOptions = filterOptionsBlocks[1]; // Group
  }

  // Clear both sections
  countryOptions.innerHTML = "";
  if (groupOptions) groupOptions.innerHTML = "";
  if (typeOptions) typeOptions.innerHTML = "";
  if (statusOptions) statusOptions.innerHTML = "";

  // Populate Country & Group
  window.db.collection("User").doc(currentUserId)
    .collection("Year").doc(window.displayYear)
    .collection("Country").get()
    .then(snapshot => {
      let firstCountryName = null;

      snapshot.forEach(countryDoc => {
        const countryName = countryDoc.id;
        if (!firstCountryName) firstCountryName = countryName;

        const btn = document.createElement("button");
        btn.className = "filter-pill";
        btn.textContent = countryName;
        countryOptions.appendChild(btn);

        btn.addEventListener("click", () => {
          if (btn.classList.contains("active")) {
            btn.classList.remove("active");
            return;
          }
          countryOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
          btn.classList.add("active");

          // only repopulate groups if groupOptions exists
          if (groupOptions) {
            // ✅ clear before repopulating
            groupOptions.innerHTML = "";
            window.db.collection("User").doc(currentUserId)
              .collection("Year").doc(window.displayYear)
              .collection("Country").doc(countryName)
              .collection("Group").get()
              .then(groupSnap => {
                groupSnap.forEach(groupDoc => {
                  const gbtn = document.createElement("button");
                  gbtn.className = "filter-pill";
                  gbtn.textContent = groupDoc.id;
                  gbtn.addEventListener("click", () => {
                    if (gbtn.classList.contains("active")) {
                      gbtn.classList.remove("active");
                      return;
                    }
                    groupOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
                    gbtn.classList.add("active");
                  });
                  groupOptions.appendChild(gbtn);
                });
              });
          }
        });
      });

      // ✅ Auto-load groups for first country
      if (firstCountryName && groupOptions) {
        groupOptions.innerHTML = ""; // clear before repopulating
        window.db.collection("User").doc(currentUserId)
          .collection("Year").doc(window.displayYear)
          .collection("Country").doc(firstCountryName)
          .collection("Group").get()
          .then(groupSnap => {
            groupSnap.forEach(groupDoc => {
              const gbtn = document.createElement("button");
              gbtn.className = "filter-pill";
              gbtn.textContent = groupDoc.id;
              gbtn.addEventListener("click", () => {
                if (gbtn.classList.contains("active")) {
                  gbtn.classList.remove("active");
                  return;
                }
                groupOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
                gbtn.classList.add("active");
              });
              groupOptions.appendChild(gbtn);
            });
          });
      }
    });

  // Populate Type (Activity or Food)
  if (typeOptions) {
    const typeCollection = window.location.pathname.endsWith("food.html") ? "FoodType" : "ActivityType";
    window.db.collection(typeCollection).get()
      .then(snapshot => {
        snapshot.forEach(typeDoc => {
          const typeName = typeDoc.id;
          const btn = document.createElement("button");
          btn.className = "filter-pill";
          btn.textContent = typeName;
          btn.addEventListener("click", () => {
            if (btn.classList.contains("active")) {
              btn.classList.remove("active");
              return;
            }
            typeOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
          });
          typeOptions.appendChild(btn);
        });
      });
  }
  // Populate Status filter (hardcoded)
  if (statusOptions) {
    const statuses = window.location.pathname.endsWith("food.html")
      ? ["All", "Saved", "Liked"]
      : ["All", "Saved", "Revisit"];

    statuses.forEach(status => {
      const btn = document.createElement("button");
      btn.className = "filter-pill";
      btn.textContent = status;
      btn.addEventListener("click", () => {
        if (btn.classList.contains("active")) {
          btn.classList.remove("active");
          return;
        }
        statusOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
      });
      statusOptions.appendChild(btn);
    });
  }

  // Attach Reset & Apply once
  const resetBtn = filterModal.querySelector("#resetFilters");
  const applyBtn = filterModal.querySelector("#applyFilters");

  resetBtn.onclick = () => {
    countryOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    if (groupOptions) groupOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    if (typeOptions) typeOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    if (statusOptions) statusOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    // reload groups for first country if groupOptions exists
    if (groupOptions) {
      const firstCountryBtn = countryOptions.querySelector(".filter-pill");
      if (firstCountryBtn) {
        const firstCountryName = firstCountryBtn.textContent;
        groupOptions.innerHTML = "";
        window.db.collection("User").doc(currentUserId)
          .collection("Year").doc(window.displayYear)
          .collection("Country").doc(firstCountryName)
          .collection("Group").get()
          .then(groupSnap => {
            groupSnap.forEach(groupDoc => {
              const gbtn = document.createElement("button");
              gbtn.className = "filter-pill";
              gbtn.textContent = groupDoc.id;
              gbtn.addEventListener("click", () => {
                groupOptions.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
                gbtn.classList.add("active");
              });
              groupOptions.appendChild(gbtn);
            });
          });
      }
    }
  };

  applyBtn.onclick = () => {
    const activeCountry = countryOptions.querySelector(".filter-pill.active");
    const activeGroup = groupOptions ? groupOptions.querySelector(".filter-pill.active") : null;
    const activeType = typeOptions ? typeOptions.querySelector(".filter-pill.active") : null;
    const activeStatus = statusOptions ? statusOptions.querySelector(".filter-pill.active") : null;
    window.selectedCountry = activeCountry ? activeCountry.textContent : "all";
    window.selectedGroup = activeGroup ? activeGroup.textContent : "all";
    window.selectedType = activeType ? activeType.textContent : "all";
    window.selectedStatus = activeStatus ? activeStatus.textContent.toLowerCase() : "all";
    
    document.dispatchEvent(new CustomEvent("filtersApplied", {}));
    // Close modal
    filterModal.classList.remove("visible");
  };

  document.dispatchEvent(new CustomEvent("filtersReady", {}));
}