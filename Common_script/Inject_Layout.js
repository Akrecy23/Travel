// THIS SCRIPT CONTAINS CODE FOR COMMON LAYOUT FOR HOME/BOOKINGS/EXPENSES/ITINERARY PAGES

// ==== CREATE HOME FRONT LAYOUT WHEN PAGE FIRST LOADS =====
document.addEventListener("DOMContentLoaded", () => {
  createHomeFrontLayout();
});

// =========== LAYOUT CREATION ==========
function createHomeFrontLayout() {
  const demo_card = document.querySelector(".demo-card");
  if (!demo_card) return;

  // ======= GET CURRENT PAGE =======
  const fileName = window.location.pathname.split("/").pop(); // e.g. "home.html"
  const pageTitle = document.title; // e.g. "Home Page"

  // ===== RIGHT-SIDE CONTROL ======
  // Decide which right-side control to render based on Page
  const useToggle = (fileName === "home.html" || pageTitle.includes("Home"));
  // Home : Toggle Btn
  // Others : Year Dropdown
  const rightControl = useToggle
    ? `
      <div class="right-controls">
        <div class="view-toggle">
          <button class="toggle-btn active">Trip Focus</button>
          <button class="toggle-btn">All Trips</button>
        </div>
        <button id="signOutBtn" class="signout-btn">Sign out</button>
      </div>
    `
    : `
      <div class="right-controls">
        <div class="year-dropdown">
          <button class="dropdown-btn" id="year-button">📌 Year ▼</button>
          <ul class="dropdown-menu" id="year-menu"></ul>
        </div>
        <button id="signOutBtn" class="signout-btn">Sign out</button>
      </div>
    `;
  // ===== EXISTENCE OF FILTER BTN ======
  const filter_search_btns = useToggle
    ? ""
    :
    `
      <div class="category-controls">
        <button id="filterToggle" class="filter-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
        </button>
        <button id="searchToggle" class="search-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
      </div>
    ` ;
    // ===== EXISTENCE OF SEARCH BTN/BAR ======
    const hidden_searchBar = useToggle
      ? ""
      : 
      `
        <div id="searchBar" class="search-bar hidden">
          <input type="text" id="searchInput" placeholder="Search itinerary..." class="search-input">
        </div>
      ` ;
  // ===== CREATE THE COMMON LAYOUT (TOP & NAVIGATION PILLS) ======
  demo_card.innerHTML = `
    <!-- Header -->
    <header class="header">
      <div class="header-container">
        <div class="header-left">
          <div class="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
            </svg>
          </div>
          <h1 class="title">My Travels</h1>
        </div>
        ${rightControl}
      </div>
    </header>
    <!-- Navigation Tabs -->
    <div class="category-section">
      <div class="category-row">
        <div class="category-pills">
          <button class="pill" data-page="bookings.html"><span class="tab-emoji">🏨</span> Bookings</button>
          <button class="pill" data-page="expenses.html"><span class="tab-emoji">🚕</span> Expenses</button>
          <button class="pill" data-page="itinerary.html"><span class="tab-emoji">🗺️</span> Itinerary</button>
          <button class="pill" data-page="activities.html"><span class="tab-emoji">🎨</span> Activities</button>
          <button class="pill" data-page="food.html"><span class="tab-emoji">🍜</span> Food</button>
        </div>
        <div class="category-controls">
          ${filter_search_btns}
        </div>
    </div>
    <!-- Hidden Search Bar -->
    ${hidden_searchBar}
    <hr class="section-divider">
  `;

  // ============ ATTACH NAVIGATION LOGIC ===========
  // Logo click → home.html
  const logo = document.querySelector(".logo");
  if (logo) {
    logo.style.cursor = "pointer"; // show pointer cursor
    logo.addEventListener("click", () => {
      window.location.href = "home.html";
    });
  }

  // Attach toggle logic only if toggle exists
  const toggleBtns = document.querySelectorAll(".toggle-btn");
  toggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      toggleBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (btn.textContent.includes("Trip Focus")) {
        console.log("Trip Focus selected");
        window.location.href = "home.html";
      } else if (btn.textContent.includes("All Trips")) {
        console.log("All Trips selected");
        document.dispatchEvent(new Event("CreateHomeBackLayout"));
      }
    });
  });

  // Get current page name (xxxx.html)
  const currentPage = location.pathname.split("/").pop();
  // Navigation logic for tabs
  const tabs = document.querySelectorAll(".pill");
  // Loop through each tab
  tabs.forEach(tab => {
    // Get tab name
    const page = tab.getAttribute("data-page");
    // If tab name = page name, highlight it (set active)
    if (page === currentPage) {
      tab.classList.add("active");
    }
    // Overwrite browser's default behaviour (custom code over button clicked)
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      tabs.forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      // If tab name = page name, highlight it (set active)
      if (page) {
        window.location.href = page;
      }
    });
  });

  // ===== AUTH LOGIC =====
  const auth = firebase.auth();

  // ===== SIGN OUT BUTTON LOGIC =====
  const signOutBtn = document.getElementById("signOutBtn");
  if (signOutBtn) {
    signOutBtn.onclick = () => {
      auth.signOut();
      window.location.href = "signin.html";
    };
  }

  auth.onAuthStateChanged(user => {
    if (user) {
      // User logged in
      window.CURRENT_UID = user.uid;
      console.log("Logged in:", user.email);

      // Notify other scripts it is safe to read Firestore
      document.dispatchEvent(new Event("HomeFrontLayoutReady"));
    } else {
      // User logged out
      window.CURRENT_UID = null;
    }
  });
}
