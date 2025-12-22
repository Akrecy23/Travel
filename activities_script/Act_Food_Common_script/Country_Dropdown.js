// THIS FILE CONTAINS CODE FOR TOGGLING BETWEEN DROPDOWN OPTIONS

// RUN WHEN HOME LAYOUT IS READY
document.addEventListener("HomeFrontLayoutReady", async () => {
  const uid = window.CURRENT_UID;
  const countryButton = document.getElementById("country-button");
  const countryMenu = document.getElementById("country-menu");

  if (!uid || !countryButton || !countryMenu) {
    console.warn("Missing elements or user not logged in.");
    return;
  }

  // Load saved country
  const savedCountry = localStorage.getItem("selectedCountry");

  // Load country list from Firestore
  let countryList = [];
  try {
    const filterDoc = await window.db
      .collection("User")
      .doc(uid)
      .collection("Suggested Activities")
      .doc("Array_Country")
      .get();

    if (filterDoc.exists) {
      countryList = filterDoc.data().CountryList || [];
    }
  } catch (err) {
    console.error("Error loading country list:", err);
  }

  // If no countries exist, stop
  if (countryList.length === 0) {
    console.warn("No countries found in CountryList.");
    return;
  }

  // Determine default country
  const defaultCountry = savedCountry && savedCountry.trim() !== ""
    ? savedCountry
    : countryList[0];

  window.displayCountry = defaultCountry;
  countryButton.textContent = `📌 ${defaultCountry} ▼`;
  localStorage.setItem("selectedCountry", defaultCountry);

  // Populate dropdown
  loadCountryDropdown(countryList);

  // Toggle dropdown
  countryButton.addEventListener("click", (e) => {
    e.stopPropagation();
    console.log("clicked");
    countryMenu.style.display =
      countryMenu.style.display === "block" ? "none" : "block";
  });

  // Close dropdown when clicking outside
  window.addEventListener("click", (e) => {
    if (!countryButton.contains(e.target) && !countryMenu.contains(e.target)) {
      countryMenu.style.display = "none";
    }
  });

  document.dispatchEvent(new Event("dropdownReady"));
});

// ======= POPULATE DROPDOWN FROM ARRAY ========
function loadCountryDropdown(countryList) {
  const countryMenu = document.getElementById("country-menu");
  const countryButton = document.getElementById("country-button");

  countryMenu.innerHTML = ""; // Clear old items

  countryList.forEach(country => {
    const li = document.createElement("li");
    li.textContent = `📍 ${country}`;
    li.dataset.country = country;

    li.addEventListener("click", () => {
      countryMenu.style.display = "none";
      countryButton.textContent = `📌 ${country} ▼`;
      localStorage.setItem("selectedCountry", country);

      document.dispatchEvent(
        new CustomEvent("countryChanged", { detail: { country } })
      );
    });

    countryMenu.appendChild(li);
  });
}