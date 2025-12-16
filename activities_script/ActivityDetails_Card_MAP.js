// THIS FILE CONTAINS CODE FOR MAP INITIALISATION

// ====== CONVERT ADDRESS TO LAT & LONG ===========
// Only need to run once for new location (or location without lat & lng)
async function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: address }, (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        resolve({ lat: location.lat(), lng: location.lng() });
      } else {
        console.error("Geocoding failed:", status);
        resolve(null);
      }
    });
  });
}

// ========= CHECK FOR LAT & LONG, ELSE CREATE ==============
// Only runs when card is flipped (or new activity is added)
async function showMapOnFlip(card, data, docRef) {
  console.log("running");
  const mapEl = card.querySelector(`#map-${data.id}`);
  if (!mapEl) return;

  // Wait until the card-back is actually visible
  await waitForVisible(mapEl);
  console.log("visible");

  // If lat/lng already exist in Firestore data, skip
  if (data.latitude && data.longitude) {
    initMap(mapEl, data.latitude, data.longitude);
    console.log("show map 1");
    return;
  }
  // Otherwise, geocode (convert) the address
  const coords = await geocodeAddress(data.Address);
  if (coords) {
    // Save back to Firestore for future use
    await docRef.update({
      latitude: coords.lat,
      longitude: coords.lng
    });
    // Update local data object too
    data.latitude = coords.lat;
    data.longitude = coords.lng;
    // Show the map
    initMap(mapEl, coords.lat, coords.lng);
    console.log("show map 2");
  } else {
    mapEl.innerHTML = "<p>Map unavailable</p>";
  }
}

// Helper: Initialize Google Map
function initMapForCard(id, lat, lng) {
  const mapEl = document.getElementById(`map-${id}`);
  if (!mapEl || mapEl.dataset.initialized) return;

  const map = new google.maps.Map(mapEl, {
    center: { lat, lng },
    zoom: 15,
    mapId: "54ef07b35601fba2e6314fdf"
  });

  new google.maps.marker.AdvancedMarkerElement({
    position: { lat, lng },
    map: map
  });
  mapEl.dataset.initialized = "true";
}

function initMap(mapEl, lat, lng) {
  const map = new google.maps.Map(mapEl, {
    center: { lat, lng },
    zoom: 15,
    mapId: "54ef07b35601fba2e6314fdf"
  });
  new google.maps.marker.AdvancedMarkerElement({
    position: { lat, lng },
    map: map,
    title: "Activity Location"
  });

}

function waitForVisible(el) {
  return new Promise(resolve => {
    const check = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  });
}


