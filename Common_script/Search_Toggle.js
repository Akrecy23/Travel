// THIS FILE CONTAINS CODE FOR SEARCH BAR

// =========== CREATE SEARCH BAR WHEN LAYOUT IS READY =============
document.addEventListener('HomeFrontLayoutReady', function() {
  // Reference to search dom elements
  const searchToggle = document.querySelector('.search-btn');
  const searchBar = document.querySelector('.search-bar');
  const searchInput = document.getElementById('searchInput');
  if (searchToggle && searchBar && searchInput) {
    // ==== TOGGLE SEARCH BAR VISIBILITY ======
    searchToggle.addEventListener('click', function() {
      searchBar.classList.toggle('hidden');
      if (!searchBar.classList.contains('hidden')) {
        searchInput.focus();
      } else {
        searchInput.value = ''; // Clear search when closed
        localStorage.setItem("currentSearchTerm", "");
        window.userSearchInput = "";
        document.dispatchEvent(new CustomEvent("SearchInputFilter", {
          detail: { searchInput: window.userSearchInput }
        }));
      }
    });

    // ======== GET USER INPUT & STORE IT =======
    // Listen for user input
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      console.log('Searching for:', searchTerm); // DEBUG PURPOSES
      // Save & Store search input
      localStorage.setItem("currentSearchTerm", searchTerm);
      window.userSearchInput = searchTerm;
      // Dispatch event to handle search filter
      document.dispatchEvent(new CustomEvent("SearchInputFilter", {
        detail: { searchInput: window.userSearchInput }
      }));
    });
  }
});

// ===== SEARCH CARDS BASED ON SEARCH INPUT & OTHER FILTERS ======
function filterTrips(searchTerm, cards, name) {
  // Normalize search term
  const term = searchTerm.toLowerCase();
  console.log("stored search: ", term)
  // Loop through all cards currently displayed
  document.querySelectorAll(cards).forEach(card => {
    const cardname = card.querySelector(name)?.textContent.toLowerCase() || "";
    // Show card if name contains search term, otherwise hide
    if (!term || cardname.includes(term)) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });
}