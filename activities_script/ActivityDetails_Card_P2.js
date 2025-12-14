// THIS FILE IS PART 2 OF ACTIVITYDETAILS_CARD.JS
// 1. FETCH ACTIVITIES FROM FIRESTORE
// 2. HANDLES BUTTON INTERACTIVITY IN EACH CARDS

async function handleActivities(subSnap, grid, statusId, activityType, currentUserId, yearId, countryId) {
  subSnap.forEach(doc => {
    const data = doc.data();
    data.id = doc.id;

    // Apply status filter
    if (statusId !== "all") {
      const fieldName = capitalize(statusId); // e.g. "Saved", "Revisit"
      if (!data[fieldName]) return;
    }

    // Create card
    const card = createActivityCard(data, activityType);
    grid.appendChild(card);

    // Firestore reference for this activity
    const docRef = window.db
      .collection("User").doc(currentUserId)
      .collection("Year").doc(yearId)
      .collection("Country").doc(countryId)
      .collection("Suggested Activities").doc("Category")
      .collection(activityType).doc(doc.id);

    // ========== FRONT EDIT BUTTON ==========
    // For editing of 2nd part of card (Name, Cost etc.)
    const topEditBtn = card.querySelector(".top-edit-btn");
    const nameEl = card.querySelector(".activity-name");
    const typeEl = card.querySelector(".activity-type");
    // Get all .detail-main and .detail-sub elements
    const detailMains = card.querySelectorAll(".detail-main");
    const detailSubs = card.querySelectorAll(".detail-sub");
    // Time and Duration
    const timeEl = detailMains[0];
    const durationEl = detailSubs[0];
    // Cost
    const costEl = detailMains[1];
    // Indoor/Outdoor
    const inOutEl = detailMains[2];
    if (topEditBtn) {
      topEditBtn.addEventListener("click", () => {
        if (card.classList.contains("editing-top")) return;
        card.classList.add("editing-top");
        // Store originals
        const originalName = nameEl.textContent;
        const originalType = typeEl.textContent;
        const [originalOpen, originalClose] = timeEl.textContent.split("–").map(s => s.trim());
        const originalDuration = durationEl.textContent.replace("Duration: ", "");
        const originalCost = costEl.textContent.replace("SGD ", "");
        const originalInOut = inOutEl?.textContent || "";
        // Replace with inputs
        nameEl.innerHTML = `<input type="text" class="edit-name" value="${originalName}">`;
        typeEl.innerHTML = `<input type="text" class="edit-type" value="${originalType}">`;
        timeEl.innerHTML = `
          <input type="text" class="edit-open" value="${originalOpen}">
          –
          <input type="text" class="edit-close" value="${originalClose}">
        `;
        durationEl.innerHTML = `<input type="text" class="edit-duration" value="${originalDuration}">`;
        costEl.innerHTML = `<input type="number" class="edit-cost" value="${originalCost}">`;
        if (inOutEl) {
          inOutEl.innerHTML = `
            <select class="edit-inout">
              <option value="Indoor" ${originalInOut === "Indoor" ? "selected" : ""}>Indoor</option>
              <option value="Outdoor" ${originalInOut === "Outdoor" ? "selected" : ""}>Outdoor</option>
            </select>
          `;
        }

        // Hide original footer buttons during editing
        const actionsContainer = card.querySelector(".card-actions");
        if (actionsContainer) actionsContainer.style.display = "none";

        // Add tick/cancel buttons
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
          durationEl.textContent = `Duration: ${originalDuration}`;
          costEl.textContent = `SGD ${originalCost}`;
          if (inOutEl) inOutEl.textContent = originalInOut;
          actionBar.remove();
          if (actionsContainer) actionsContainer.style.display = "flex";
          card.classList.remove("editing-top");
        });

        // Tick → update Firestore
        actionBar.querySelector(".top-tick-btn").addEventListener("click", async () => {
          let newOpen = formatTimeInput(card.querySelector(".edit-open").value);
          let newClose = formatTimeInput(card.querySelector(".edit-close").value);
          // Clean inputs: remove unwanted characters, normalize spacing
          const timeRegex = /^([0-9]{1,2}:[0-9]{2})\s?(AM|PM)$/i;
          if (!timeRegex.test(newOpen)) newOpen = originalOpen;
          if (!timeRegex.test(newClose)) newClose = originalClose;

          const newName = card.querySelector(".edit-name").value.trim();
          const newType = card.querySelector(".edit-type").value.trim();
          const newDuration = card.querySelector(".edit-duration").value.trim();
          const newCost = parseFloat(card.querySelector(".edit-cost").value);
          const newInOut = card.querySelector(".edit-inout")?.value || "";

          try {
            await docRef.update({
              Name: newName,
              Type: newType,
              OpenTime: newOpen,
              CloseTime: newClose,
              ActivityDuration: newDuration,
              EstCost: newCost,
              InOut_Door: newInOut
            });

            // Refresh UI
            loadActivityCards(yearId, countryId, activityType, statusId);
          } catch (err) {
            console.error("Error updating activity details:", err);
          } finally {
            actionBar.remove();
            if (actionsContainer) actionsContainer.style.display = "flex";
            card.classList.remove("editing-top");
          }
        });
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
        loadActivityCards(yearId, countryId, activityType, statusId);
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
        loadActivityCards(yearId, countryId, activityType, statusId);
      });
    }

    // ========== REMARKS EDIT ==========
    const editBtn = card.querySelector(".edit-btn");
    const remarksText = card.querySelector(".remarks-text");
    const remarksSection = card.querySelector(".remarks-section");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        if (remarksSection.classList.contains("editing")) return;
        remarksSection.classList.add("editing");

        // Hide original footer buttons during editing
        const actionsContainer = card.querySelector(".card-actions-remarks");
        if (actionsContainer) actionsContainer.style.display = "none";

        // Add ✔ ✖ action bar
        const editActions = document.createElement("div");
        editActions.className = "edit-actions";
        editActions.innerHTML = `
          <button class="tick-btn">✔</button>
          <button class="cancel-btn">✖</button>
        `;
        actionsContainer.insertAdjacentElement("afterend", editActions);
        
        const originalText = remarksText.textContent;

        remarksText.innerHTML = `
          <textarea class="remarks-input">${originalText}</textarea>
        `;
        const input = remarksText.querySelector(".remarks-input");
        editActions.querySelector(".cancel-btn").addEventListener("click", () => {
          remarksText.textContent = originalText;
          editActions.remove();
          if (actionsContainer) actionsContainer.style.display = "flex";
          remarksSection.classList.remove("editing");
        });
        editActions.querySelector(".tick-btn").addEventListener("click", async () => {
          const newText = input.value.trim();
          await docRef.update({ Remarks: newText });
          remarksText.textContent = newText || "No remarks yet";
          editActions.remove();
          if (actionsContainer) actionsContainer.style.display = "flex";
          remarksSection.classList.remove("editing");
        });
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
                About: "Activity",
                Tag: data.Type,
                Address: data.Address || "",
                Description: data.Name || "",
                Order: nextOrder,
                Remarks: data.Remarks,
                Time: "",
              });
              // Collapse UI
              tripExpand.classList.add("hidden");
              card.classList.remove("expanded");
              // Refresh cards so update/filter applies immediately
              loadActivityCards(yearId, countryId, activityType, statusId);
            } catch (err) {
              console.error("Error adding activity to trip itinerary:", err);
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
  });
}