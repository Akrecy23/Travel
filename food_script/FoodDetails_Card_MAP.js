// THIS FILE CONTAINS CODE FOR MAP INITIALISATION

// ====== CONVERT ADDRESS TO LAT & LONG ===========
// Only need to run once for new location (or location without lat & lng)
async function geocodeAddress(address) {
  const apiKey = "AIzaSyDAgDHi85w4J9ezEl6nIumKBKAwWjmWsVo"; // replace with your key
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results[0]) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } else {
      console.error("Geocoding failed:", data.status);
      return null;
    }
  } catch (err) {
    console.error("Error calling Geocoding API:", err);
    return null;
  }
}

// ========= CHECK FOR LAT & LONG, ELSE CREATE ==============
// Only runs when card is flipped (or new food is added)
async function showMapOnFlip(card, data, docRef) {
  const mapEl = card.querySelector(`#map-${data.id}`);
  if (!mapEl) return;
  // If lat/lng already exist in Firestore data, skip
  if (data.latitude && data.longitude) {
    initMap(mapEl, data.latitude, data.longitude);
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
    title: "Food Location"
  });
}