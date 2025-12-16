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
  const mapEl = card.querySelector(`#map-${data.id}`);
  if (!mapEl) return;

  // Wait until the card-back is actually visible
  await waitForVisible(mapEl);

  // If lat/lng already exist in Firestore data, skip
  if (data.latitude && data.longitude) {
    initMap(mapEl, data.latitude, data.longitude);
    attachDirectionsHandler(mapEl, data.Address);
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
    attachDirectionsHandler(mapEl, data.Address);
  } else {
    mapEl.innerHTML = "<p>Map unavailable</p>";
  }
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

function attachDirectionsHandler(mapEl, address) {
  if (!mapEl || !address) return;

  if (mapEl.dataset.directionsAttached) return;
  mapEl.dataset.directionsAttached = "true";

  mapEl.style.cursor = "pointer";

  mapEl.addEventListener("click", () => {
    const encodedAddress = encodeURIComponent(address);
    const ua = navigator.userAgent;

    let mapsUrl;

    // iOS
    if (/iPhone|iPad|iPod/i.test(ua)) {
      const googleMapsUrl = `comgooglemaps://?q=${encodedAddress}`;
      const appleMapsUrl = `http://maps.apple.com/?q=${encodedAddress}`;

      let opened = false;

      const handleVisibility = () => {
        opened = true;
        document.removeEventListener("visibilitychange", handleVisibility);
      };

      document.addEventListener("visibilitychange", handleVisibility);

      // Try Google Maps
      window.location.href = googleMapsUrl;

      // Fallback to Apple Maps
      setTimeout(() => {
        if (!opened) {
          window.location.href = appleMapsUrl;
        }
      }, 3000);

      return;
    }

    // Android
    else if (/Android/i.test(ua)) {
      mapsUrl = `geo:0,0?q=${encodedAddress}`;
    }

    // Desktop
    else {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }

    window.location.href = mapsUrl;
  });
}

