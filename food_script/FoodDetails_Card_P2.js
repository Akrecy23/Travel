// THIS FILE IS PART 2 OF FOODDETAILS_CARD.JS
// 1. FETCH FOOD FROM FIRESTORE
// 2. HANDLES BUTTON INTERACTIVITY IN EACH CARDS

async function handleFood(subSnap, cardsContainer, statusId, foodType, currentUserId, yearId, countryId) {
  subSnap.forEach(doc => {
    const data = doc.data();
    data.id = doc.id;

    // Apply status filter
    if (statusId !== "all") {
      const fieldName = capitalize(statusId); // e.g. "Saved", "Completed"
      if (!data[fieldName]) return;
    }

    // Create card
    const card = createFoodCard(data, foodType);
    cardsContainer.appendChild(card);

    // Firestore reference for this activity
    const docRef = window.db
      .collection("User").doc(currentUserId)
      .collection("Year").doc(yearId)
      .collection("Country").doc(countryId)
      .collection("Suggested Food").doc("Category")
      .collection(foodType).doc(doc.id);

    // ========== LIKE BUTTON ==========
    const likeBtn = card.querySelector(".like-btn");
    if (likeBtn) {
      likeBtn.addEventListener("click", async () => {
        // Toggle active class
        const isActive = likeBtn.classList.toggle("active");
        await docRef.update({ isLiked: isActive });
        // Refresh cards so filter applies immediately
        loadFoodCards(yearId, countryId, foodType, statusId);
      });
    }

    // ========== SAVE BUTTON ==========
    const saveBtn = card.querySelector(".save-btn");
      if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
          // Toggle active class
          const isActive = saveBtn.classList.toggle("active");
          await docRef.update({ isSaved: isActive });
          // Refresh cards so filter applies immediately
          loadFoodCards(yearId, countryId, foodType, statusId);
      });
    }

    // ========== SEE MORE BUTTON ==========
    const seeMoreBtn = card.querySelector(".see-more-btn");
    if (seeMoreBtn) {
      seeMoreBtn.addEventListener("click", () => {
        card.classList.add("flipped");
      });
    }

    // ========== BACK BUTTON ===========
    const flipBackBtn = card.querySelector(".flip-back-btn");
    if (flipBackBtn) {
      flipBackBtn.addEventListener("click", () => {
        card.classList.remove("flipped");
      });
    }

    // ========== ADD TO TRIP BUTTON ===========
    const addTripBtn = card.querySelector(".trip-btn");
    const tripExpand = card.querySelector(".trip-expand");
    if (addTripBtn && tripExpand) {
      addTripBtn.addEventListener("click", async () => {
        // Expand the card
        tripExpand.classList.remove("hidden");
        card.classList.add("expanded");
        const addedInfoRow = tripExpand.querySelector(".added-info-row");
        addedInfoRow.innerHTML = "";
        // Show list of trips Activity has been added into
        if (Array.isArray(data.AddedTo) && data.AddedTo.length > 0) {
          const info = document.createElement("div");
          info.className = "added-info";
          info.textContent = `Already added to: ${data.AddedTo.join(", ")}`;
          addedInfoRow.appendChild(info);
        }
        // Fetch trips from Firestore
        const groupsSnap = await window.db
          .collection("User").doc(currentUserId)
          .collection("Year").doc(yearId)
          .collection("Country").doc(countryId)
          .collection("Group").get();
        const dropdown = tripExpand.querySelector(".trip-dropdown");
        dropdown.innerHTML = "";
        // Add listener once: When trip selected, fetch itinerary days
        if (!dropdown.dataset.listenerAttached) {
          dropdown.addEventListener("change", async () => {
            const selectedTripId = dropdown.value;
            const selectedOption = dropdown.selectedOptions[0];
            const groupId = selectedOption.dataset.groupId;
            const dayRow = tripExpand.querySelector(".day-select-row");
            dayRow.innerHTML = "";
            // Find itinerary days
            const itinerarySnap = await window.db
              .collection("User").doc(currentUserId)
              .collection("Year").doc(yearId)
              .collection("Country").doc(countryId)
              .collection("Group").doc(groupId)
              .collection("Trip").doc(selectedTripId)
              .collection("Itinerary").get();
            itinerarySnap.forEach(dayDoc => {
              const label = document.createElement("label");
              const radio = document.createElement("input");
              radio.type = "radio";
              radio.name = "daySelect";
              radio.value = dayDoc.id;
              label.appendChild(radio);
              label.append(" " + dayDoc.id);
              dayRow.appendChild(label);
            });
          });
          dropdown.dataset.listenerAttached = "true";
        }
        // Populate trips
        for (const groupDoc of groupsSnap.docs) {
          const tripsSnap = await groupDoc.ref.collection("Trip").get();
          tripsSnap.forEach(tripDoc => {
            const opt = document.createElement("option");
            opt.value = tripDoc.id;
            opt.textContent = tripDoc.id;
            opt.dataset.groupId = groupDoc.id; // Store group id
            dropdown.appendChild(opt);
          });
        }
        // After populating dropdown options
        if (dropdown.options.length > 0) {
          dropdown.selectedIndex = 0; // ensure first option is selected
          dropdown.dispatchEvent(new Event("change")); // 🔑 trigger change once
        }
        // Confirm button
        const confirmBtn = tripExpand.querySelector(".trip-confirm-btn");
        if (!confirmBtn.dataset.listenerAttached) {
          confirmBtn.addEventListener("click", async () => {
            // Get Group
            const selectedOption = dropdown.selectedOptions[0];
            const groupId = selectedOption?.dataset.groupId;
            // Get Trip Name
            const selectedTrip = dropdown.value;
            // Get Day
            const selectedDay = tripExpand.querySelector("input[name='daySelect']:checked")?.value;
            if (!groupId || !selectedTrip || !selectedDay) {
              alert("Please select a trip and day");
              return;
            }
            try{
              // Save trip name to AddedTo field
              await docRef.update({
                AddedTo: window.firebase.firestore.FieldValue.arrayUnion(selectedTrip)
              });
              // Add to Itinerary
              const itineraryDayRef = window.db
                .collection("User").doc(currentUserId)
                .collection("Year").doc(yearId)
                .collection("Country").doc(countryId)
                .collection("Group").doc(groupId)
                .collection("Trip").doc(selectedTrip)
                .collection("Itinerary").doc(selectedDay)
                .collection("Activities")
              // Count existing docs to determine next Order
              const existingSnap = await itineraryDayRef.get();
              const nextOrder = existingSnap.size + 1;
              await itineraryDayRef.doc(data.id).set({
                About: "Food",
                Tag: foodType,
                Address: data.Address || "",
                Description: data.Name || "",
                Order: nextOrder,
                Remarks: `${data.About} - ${data.Remarks || ""}`,
                Time: "",
              });
              // Collapse UI
              tripExpand.classList.add("hidden");
              card.classList.remove("expanded");
              // Refresh cards so update/filter applies immediately
              loadFoodCards(yearId, countryId, foodType, statusId);
            } catch (err) {
              console.error("Error adding food to trip itinerary:", err);
              alert("Failed to add to trip. Please try again.");
            }
          });
          confirmBtn.dataset.listenerAttached = "true";
        }
      });
    }

    // ========== CLOSE EXPANDED UI BUTTON ===========
    const closeBtn = card.querySelector(".trip-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        tripExpand.classList.add("hidden");
        card.classList.remove("expanded");
      });
    }

    // ========== DIRECTIONS BUTTON ===========
    const directionsBtn = card.querySelector(".btn.btn-icon[title='Directions']");
    if (directionsBtn) {
      directionsBtn.addEventListener("click", () => {
        const address = card.getAttribute("data-address");
        if (!address) {
          console.warn("No address available for directions");
          return;
        }

        const encodedAddress = encodeURIComponent(address);
        const ua = navigator.userAgent;
        
        let mapsUrl;
        
        // iOS
        if (/iPhone|iPad|iPod/i.test(ua)) {
          const googleMapsUrl = `comgooglemaps://?q=${encodedAddress}`;
          const appleMapsUrl = `http://maps.apple.com/?q=${encodedAddress}`;
        
          let opened = false;
        
          // If the page becomes hidden, it means Google Maps opened
          const handleVisibility = () => {
            opened = true;
            document.removeEventListener("visibilitychange", handleVisibility);
          };
        
          document.addEventListener("visibilitychange", handleVisibility);
        
          // Try Google Maps
          window.location.href = googleMapsUrl;
        
          // After 500ms, if still visible → Google Maps is NOT installed → open Apple Maps
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
  });
}




