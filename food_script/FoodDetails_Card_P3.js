// THIS FILE IS PART 2 OF FOODDETAILS_CARD.JS
// 1. FETCH FOOD FROM FIRESTORE
// 2. HANDLES BUTTON INTERACTIVITY IN EACH CARDS

async function attachFoodListeners(card, data, userId, country, city, year, actType, status) {
  const docRef = window.db
    .collection("User").doc(userId)
    .collection("Suggested Food")
    .doc(data.id);

    // ========== FRONT EDIT BUTTON ==========
    const topEditBtn = card.querySelector(".top-edit-btn");
    const nameEl = card.querySelector(".food-name");
    const typeEl = card.querySelector(".food-type");
    // Get all .detail-main and .detail-sub elements
    const detailMains = card.querySelectorAll(".detail-main");
    const detailSubs = card.querySelectorAll(".detail-sub");
    // Time
    const timeEl = detailMains[0];
    // Cost
    const costEl = detailMains[1];
    // Remarks
    const remarksText = card.querySelector(".remarks-text");
    const remarksSection = card.querySelector(".remarks-section");

    if (topEditBtn) {
      topEditBtn.addEventListener("click", () => {
        if (card.classList.contains("editing-top")) return;
        card.classList.add("editing-top");
        // Store originals
        const originalName = nameEl.textContent;
        const originalType = typeEl.textContent;
        const [originalOpen, originalClose] = timeEl.textContent.split("–").map(s => s.trim());
        const originalCost = costEl.textContent.replace("SGD ", "");
        const originalText = remarksText.textContent.trim();
        // Clean up values first
        const cleanCost = originalCost === "-" ? "" : originalCost;
        let textValue = originalText.toLowerCase() === "no remarks yet" ? "" : originalText;
        // Replace with inputs
        nameEl.innerHTML = `<input type="text" class="edit-name" value="${originalName}">`;
        typeEl.innerHTML = `
        <select class="edit-type">
          <option value="chinese" ${originalType.toLowerCase()==="chinese"?"selected":""}>Chinese</option>
          <option value="japanese" ${originalType.toLowerCase()==="japanese"?"selected":""}>Japanese</option>
          <option value="italian" ${originalType.toLowerCase()==="italian"?"selected":""}>Italian</option>
          <option value="indian" ${originalType.toLowerCase()==="indian"?"selected":""}>Indian</option>
          <option value="mexican" ${originalType.toLowerCase()==="mexican"?"selected":""}>Mexican</option>
          <option value="korean" ${originalType.toLowerCase()==="korean"?"selected":""}>Korean</option>
          <option value="thai" ${originalType.toLowerCase()==="thai"?"selected":""}>Thai</option>
          <option value="vegetarian" ${originalType.toLowerCase()==="vegetarian"?"selected":""}>Vegetarian</option>
          <option value="seafood" ${originalType.toLowerCase()==="seafood"?"selected":""}>Seafood</option>
          <option value="desserts" ${originalType.toLowerCase()==="desserts"?"selected":""}>Desserts</option>
          <option value="nightmarket" ${originalType.toLowerCase()==="nightmarket"?"selected":""}>Night Market</option>
          <option value="others" ${originalType.toLowerCase()==="others"?"selected":""}>Others</option>
        </select>
      `;
        timeEl.innerHTML = `
          <input type="text" class="edit-open" value="${toTimeInputValue(originalOpen)}">
          –
          <input type="text" class="edit-close" value="${toTimeInputValue(originalClose)}">
        `;
        costEl.innerHTML = `<input type="number" class="edit-cost" value="${cleanCost}">`;
        remarksText.innerHTML = `
          <textarea class="remarks-input">${textValue}</textarea>
        `;

        // Hide original footer buttons during editing
        const actionsContainer = card.querySelector(".card-actions");
        if (actionsContainer) actionsContainer.style.display = "none";

        // Add ✔ ✖ action bar
        const actionBar = document.createElement("div");
        actionBar.className = "top-edit-actions";
        actionBar.innerHTML = `
          <button class="top-tick-btn">✔</button>
          <button class="top-cancel-btn">✖</button>
        `;
        actionsContainer.insertAdjacentElement("afterend", actionBar);

        // Cancel → restore original values
        actionBar.querySelector(".top-cancel-btn").addEventListener("click", () => {
          nameEl.textContent = originalName;
          typeEl.textContent = originalType;
          timeEl.textContent = `${originalOpen} – ${originalClose}`;
          costEl.textContent = `SGD ${originalCost}`;
          remarksText.textContent = originalText;
          actionBar.remove();
          if (actionsContainer) actionsContainer.style.display = "flex";
          card.classList.remove("editing-top");
        });

        // Tick → update Firestore
        actionBar.querySelector(".top-tick-btn").addEventListener("click", async () => {
          let newOpen = formatTimeInput(card.querySelector(".edit-open").value);
          let newClose = formatTimeInput(card.querySelector(".edit-close").value);
          const newName = card.querySelector(".edit-name").value.trim();
          const newType = card.querySelector(".edit-type").value.trim();
          const newCost = parseFloat(card.querySelector(".edit-cost").value);
          const newText = remarksText.querySelector(".remarks-input").value.trim();

          try {
            await docRef.update({
              Name: newName,
              Type: newType,
              OpenTime: newOpen,
              CloseTime: newClose,
              EstCost: newCost,
              Remarks: newText
            });

            // Refresh UI
            loadFoodCards(country, city, year, actType, status);
          } catch (err) {
            console.error("Error updating food details:", err);
          } finally {
            actionBar.remove();
            if (actionsContainer) actionsContainer.style.display = "flex";
            card.classList.remove("editing-top");
          }
        });
      });
    }

    // ========== FRONT DELETE BUTTON ==========
    const deleteBtn = card.querySelector(".top-delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        const confirmed = confirm(`Delete ${data.Name}?`);
        if (!confirmed) return;
        try{
          const foodRef = window.db
          .collection("User").doc(userId)
            .collection("Suggested Food").doc(data.id)
          // Delete the food
          await foodRef.delete();
          // Remove from UI
          card.remove();
        } catch (err) {
          console.error("Error deleting food:", err);
        }
      });
    }

    // ========== SAVE BUTTON ==========
    const saveBtn = card.querySelector(".save-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        // Toggle active class
        const isActive = saveBtn.classList.toggle("active");
        await docRef.update({ Saved: isActive });
        // Reflect in status bar
        updateStatusBadge(card, "saved", isActive, "Saved");
        // Refresh cards so filter applies immediately
        loadFoodCards(country, city, year, actType, status);
      });
    }

    // ========== REVISIT BUTTON ==========
    const revisitBtn = card.querySelector(".revisit-btn");
    if (revisitBtn) {
      revisitBtn.addEventListener("click", async () => {
        // Toggle based on current state in data, not just class
        const isActive = !data.Revisit;
        // Update Firestore
        await docRef.update({ Revisit: isActive });
        // Update local state
        data.Revisit = isActive;
        // Reflect in status bar
        updateStatusBadge(card, "revisit", isActive, "Revisit");
        // Update button text + style
        revisitBtn.textContent = isActive ? "Remove from Revisit" : "Add to Revisit";
        revisitBtn.classList.toggle("active", isActive);
        // Refresh cards so filter applies immediately
        loadFoodCards(country, city, year, actType, status);
      });
    }

    // ========== MAP BUTTON ==========
    card.querySelector(".map-btn")?.addEventListener("click", async () => {
      card.classList.add("flipped");
      await showMapOnFlip(card, data, docRef);
    });

    // ========== BACK BUTTON ==========
    card.querySelector(".back-btn")?.addEventListener("click", () => {
      card.classList.remove("flipped");
    });

    // ========== MAP CONTAINER ===========
    const mapContainer = card.querySelector(`.map-container#map-${data.id}`);
    if (mapContainer) {
      mapContainer.addEventListener("click", () => {
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

    // ========== ADDRESS EDIT ==========
    const addrEditBtn = card.querySelector(".addr-edit-btn");
    const addressLabel = card.querySelector(".address-label");
    const addressRow = card.querySelector(".address-row");
    if (addrEditBtn) {
      addrEditBtn.addEventListener("click", () => {
        if (addressRow.classList.contains("editing")) return;
        addressRow.classList.add("editing");
        const originalText = data.Address || "";
        addressLabel.innerHTML = `
          <strong>Address:</strong>
          <textarea class="address-input">${originalText}</textarea>
          <div class="address-actions">
            <button class="tick-btn">✔</button>
            <button class="cancel-btn">✖</button>
          </div>`;
        const input = addressLabel.querySelector(".address-input");
        // Cancel → restore original text
        addressLabel.querySelector(".cancel-btn").addEventListener("click", () => {
          addressLabel.innerHTML = `<strong>Address:</strong> ${originalText}`;
          addressRow.classList.remove("editing");
        });
        // Tick → update Firestore
        addressLabel.querySelector(".tick-btn").addEventListener("click", async () => {
          const newText = input.value.trim();
          try{
            await docRef.update({ Address: newText });
            addressLabel.innerHTML = `<strong>Address:</strong> ${newText || "No address yet"}`;
            addressRow.classList.remove("editing");
            // Refresh the map
            if (newText && newText !== originalText) {
              // Get new lat & lng
              const coords = await geocodeAddress(newText);
              if (coords) {
                // Save lat & lng back to Firestore
                await docRef.update({ latitude: coords.lat, longitude: coords.lng });
                // Update local data object
                data.latitude = coords.lat;
                data.longitude = coords.lng;
                // Re-render the map
                const mapEl = card.querySelector(`#map-${data.id}`);
                if (mapEl) initMap(mapEl, coords.lat, coords.lng);
              }
            }
          } catch (error) {
              console.error("Error updating address:", error);
              // Restore original text if update fails
              addressLabel.innerHTML = `<strong>Address:</strong> ${originalText}`;
            } finally {
              addressRow.classList.remove("editing");
            }
        });
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
        // Show list of trips Food has been added into
        if (Array.isArray(data.AddedTo) && data.AddedTo.length > 0) {
          // Clean AddedTo array by checking Deleted Itinerary
          const foodRef = window.db
            .collection("User").doc(userId)
            .collection("Suggested Food").doc(data.id);

          let updatedAddedTo = [...data.AddedTo]; // local copy
        
          for (const tripId of data.AddedTo) {
            try{
              const deletedSnap = await window.db
                .collection("Trips").doc(tripId)
                .collection("Deleted Itinerary").doc(data.id)
                .get();
          
              if (deletedSnap.exists) {
                // Remove tripId from AddedTo if food is deleted in that trip
                await foodRef.update({
                  AddedTo: window.firebase.firestore.FieldValue.arrayRemove(tripId)
                });
                // Also delete the Deleted Itinerary doc
                await window.db
                  .collection("Trips").doc(tripId)
                  .collection("Deleted Itinerary").doc(data.id)
                  .delete();
                // Update local copy
                updatedAddedTo = updatedAddedTo.filter(id => id !== tripId);
              }
            } catch (err) {
              if (err.code === "permission-denied") {
                // Collaborator no longer has access to this trip
                await foodRef.update({
                  AddedTo: window.firebase.firestore.FieldValue.arrayRemove(tripId)
                });
                updatedAddedTo = updatedAddedTo.filter(id => id !== tripId);
              } else {
                console.error("Error checking Deleted Itinerary:", err);
              }
            }
          }

          // Only create the div if updatedAddedTo is not empty
          if (updatedAddedTo.length > 0) {
            const titles = [];
            for (const tripId of updatedAddedTo) {
              const tripSnap = await window.db.collection("Trips").doc(tripId).get();
              if (tripSnap.exists) {
                const tripData = tripSnap.data();
                titles.push(tripData.title || tripId); // fallback to ID if no title
              }
            }
        
            const info = document.createElement("div");
            info.className = "added-info";
            info.textContent = `Already added to: ${titles.join(", ")}`;
            addedInfoRow.appendChild(info);
          }
        }

        // Fetch country of food
        const countryId = card.dataset.country;

        // Query trips owned or collaborated by user
        const ownedSnap = await window.db.collection("Trips")
          .where("ownerUid", "==", userId)
          .get();
      
        const collabSnap = await window.db.collection("Trips")
          .where("collaboratorIds", "array-contains", userId)
          .get();
      
        const allTrips = [...ownedSnap.docs, ...collabSnap.docs];

        // After fetching allTrips (owned + collab)
        const yearDropdown = tripExpand.querySelector(".year-dropdown");
        const tripDropdown = tripExpand.querySelector(".trip-dropdown");
        yearDropdown.innerHTML = "";
        tripDropdown.innerHTML = "";

        // Always add a default option
        const defaultOpt = document.createElement("option");
        defaultOpt.value = "";
        defaultOpt.textContent = "Select year";
        yearDropdown.appendChild(defaultOpt);
        
        // Collect unique years from trip documents
        const yearSet = new Set();
        for (const tripDoc of allTrips) {
          const tripData = tripDoc.data();
          if (tripData.year) {
            yearSet.add(tripData.year); // year is stored as number or string in trip doc
          }
        }
        
        // Populate year dropdown with unique years
        Array.from(yearSet).sort().forEach(yearVal => {
          const opt = document.createElement("option");
          opt.value = yearVal;
          opt.textContent = yearVal;
          yearDropdown.appendChild(opt);
        });
        
        // Add year listener once: When year selected, fetch trips
        if (!yearDropdown.dataset.listenerAttached){
          yearDropdown.addEventListener("yearChange", async () => {
            const selectedYear = yearDropdown.value;
            // Clear trip dropdown first
            tripDropdown.innerHTML = "";
            const tripsForYear = allTrips.filter(doc => {
              const tripData = doc.data();
              return (
                tripData.year === selectedYear &&
                Array.isArray(tripData.cities) &&
                tripData.cities.includes(card.dataset.city) // card.dataset.city is the city the card belongs to
              );
            });
            tripsForYear.forEach(tripDoc => {
              const opt = document.createElement("option");
              opt.value = tripDoc.id;
              opt.textContent = tripDoc.data().title || tripDoc.id;
              tripDropdown.appendChild(opt);
            });
            
            // Clear itinerary days list first
            const dayRow = tripExpand.querySelector(".day-select-row");
            dayRow.innerHTML = "";
            // Add Trip listener once: When Trip selected, fetch Itinerary Days
            if (!tripDropdown.dataset.listenerAttached) {
              tripDropdown.addEventListener("tripChange", async () => {
                const selectedTripId = tripDropdown.value;
                dayRow.innerHTML = "";

                // Fetch itinerary days
                const itinerarySnap = await window.db
                  .collection("Trips").doc(selectedTripId)
                  .collection("Itinerary")
                  .get();

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
              tripDropdown.dataset.listenerAttached = "true";
            }
            if (tripDropdown.options.length > 0) {
              tripDropdown.selectedIndex = 0; // ensure first option is selected
              tripDropdown.dispatchEvent(new Event("tripChange")); // 🔑 trigger change once
            }
          })
          yearDropdown.dataset.listenerAttached = "true";
        }

        // After populating dropdown options
        if (yearDropdown.options.length > 0) {
          yearDropdown.selectedIndex = 0; // ensure first option is selected
          yearDropdown.dispatchEvent(new Event("yearChange")); // 🔑 trigger change once
        }
        // Confirm button
        const confirmBtn = tripExpand.querySelector(".trip-confirm-btn");
        if (!confirmBtn.dataset.listenerAttached) {
          confirmBtn.addEventListener("click", async () => {
            // Get selected Year
            const selectedYear = yearDropdown.value;

            // Get selected Trip
            const selectedTrip = tripDropdown.value;

            // Get Day
            const dayRadio = tripExpand.querySelector("input[name='daySelect']:checked")?.value;
            if (!dayRadio) {
              alert("Please select a day");
              return;
            } try{
              // Save trip name to AddedTo field
              await docRef.update({
                AddedTo: window.firebase.firestore.FieldValue.arrayUnion(selectedTrip)
              });
              // Add to Itinerary
              const itineraryDayRef = window.db
                .collection("Trips").doc(selectedTrip)
                .collection("Itinerary").doc(dayRadio)
                .collection("Activities");
              
              // Count existing docs to determine next Order
              const existingSnap = await itineraryDayRef.get();
              const nextOrder = existingSnap.size + 1;
              await itineraryDayRef.doc(data.id).set({
                About: "Food",
                Tag: data.Type,
                Address: data.Address || "",
                Description: data.Name || "",
                Order: nextOrder,
                Remarks: data.Remarks,
                Time: "",
                UserId: userId
              });
              // Collapse UI
              tripExpand.classList.add("hidden");
              card.classList.remove("expanded");
              // Refresh cards so update/filter applies immediately
              loadFoodCards(country, city, year, actType, status);
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
}









