// FUNCTION FOR EDITING OF BACK SIDE OF CARDS (ACTIVITY DETAILS)
async function enableActivityEditing(entry, tripId, dayId, activityId, days) {
  //Add a flag to mark "edit" mode
  entry.classList.add("editing");
  
  const timeEl = entry.querySelector(".time");
  const descEl = entry.querySelector(".box-title h4");
  const remarksEl = entry.querySelector(".remarks-text");
  const addrEl = entry.querySelector(".addr-text");
  const tagEl = entry.querySelector(".box .tag");

  // Store originals
  const originalTime = timeEl.textContent || "";
  const originalDesc = descEl.textContent || "";
  const originalRemarks = remarksEl.textContent || "";
  const originalAddress = addrEl.textContent || "";
  const originalTag = tagEl ? tagEl.textContent : "";
  const originalAbout = entry.getAttribute("data-about") || "";

  // Replace with inputs
  timeEl.innerHTML = `<input type="text" class="edit-time" placeholder="(Time)" value="${originalTime}">`;
  descEl.innerHTML = `<input type="text" class="edit-description" placeholder="(Activity Header)" value="${originalDesc}">`;
  remarksEl.innerHTML = `<textarea class="edit-remarks" placeholder="(Remarks)">${originalRemarks}</textarea>`;
  addrEl.innerHTML = `<input type="text" class="edit-addr" placeholder="(Address)" value="${originalAddress}">`;
  // About dropdown
  const aboutSelectHTML = `
    <select class="edit-about">
      <option value="Transport" ${originalAbout==="Transport"?"selected":""}>Transport</option>
      <option value="Accommodation" ${originalAbout==="Accommodation"?"selected":""}>Accommodation</option>
      <option value="Food" ${originalAbout==="Food"?"selected":""}>Food</option>
      <option value="Activity" ${originalAbout==="Activity"?"selected":""}>Activity</option>
      <option value="Others" ${originalAbout==="Others"?"selected":""}>Others</option>
    </select>
  `;
  addrEl.insertAdjacentHTML("afterend", aboutSelectHTML);
  const aboutSelect = entry.querySelector(".edit-about");
  if (originalAbout) {
    aboutSelect.value = originalAbout.charAt(0).toUpperCase() + originalAbout.slice(1).toLowerCase();
  }

  // Tag dropdown wrapper
  const tagWrapper = document.createElement("div");
  tagWrapper.className = "edit-tag-wrapper";
  tagWrapper.style.marginTop = "0.5rem";
  tagWrapper.style.display = "none";
  tagWrapper.innerHTML = `<select class="edit-tag"></select>`;
  aboutSelect.insertAdjacentElement("afterend", tagWrapper);
  const tagSelect = tagWrapper.querySelector(".edit-tag");

  function populateTags(aboutVal) {
    tagSelect.innerHTML = "";
    if (aboutVal === "Food") {
      [
        "Chinese","Japanese","Italian","Indian","Mexican",
        "Korean","Thai","Vegetarian","Seafood","Desserts","NightMarket","Others"
      ].forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        if (opt === originalTag) o.selected = true;
        tagSelect.appendChild(o);
      });
      tagWrapper.style.display = "block";
    } else if (aboutVal === "Activity") {
      [
        "Workshop","Shopping","Hiking","Museum","Exhibition","Concert",
        "Sports","Beach","Cultural","Relaxation","Others"
      ].forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        if (opt === originalTag) o.selected = true;
        tagSelect.appendChild(o);
      });
      tagWrapper.style.display = "block";
    } else {
      tagWrapper.style.display = "none";
    }
  }

  // Initialize based on original About
  populateTags(originalAbout);
  aboutSelect.addEventListener("change", () => {
    populateTags(aboutSelect.value);
  });

  // Hide original actions
  const actions = entry.querySelector(".box-actions");
  actions.style.display = "none";

  // Add ✔ ✖ action bar
  const editActions = document.createElement("div");
  editActions.className = "activity-edit-actions";
  editActions.innerHTML = `
    <button class="activity-save-btn">✔</button>
    <button class="activity-cancel-btn">✖</button>
  `;
  actions.insertAdjacentElement("afterend", editActions);

  // Cancel → restore
  editActions.querySelector(".activity-cancel-btn").addEventListener("click", () => {
    timeEl.textContent = originalTime;
    descEl.textContent = originalDesc;
    remarksEl.textContent = originalRemarks;
    if (originalAddress) {
      addrEl.innerHTML = `<span class="address-link" data-address="${originalAddress}">${originalAddress}</span>`;
    } else {
      addrEl.textContent = "";
    }
    // Remove the edit dropdown wrapper completely
    tagWrapper.remove();
    // Restore the original tag if it existed
    if (originalTag) {
      const statusRow = entry.querySelector(".status-row div");
      statusRow.innerHTML = `<span class="tag Default ${originalTag}">${originalTag}</span>`;
    }
    aboutSelect.remove();
    editActions.remove();
    actions.style.display = "flex";
    entry.classList.remove("editing");
  });

  // Save → update Firestore
  editActions.querySelector(".activity-save-btn").addEventListener("click", async () => {
    const newTime = entry.querySelector(".edit-time").value.trim();
    const newDesc = entry.querySelector(".edit-description").value.trim();
    const newRemarks = entry.querySelector(".edit-remarks").value.trim();
    const newAddress = entry.querySelector(".edit-addr").value.trim();
    const newAbout = aboutSelect.value;
    let newTag = "";

    if (newAbout === "Food" || newAbout === "Activity") {
      newTag = tagSelect.value;
    } else {
      newTag = newAbout; // Transport, Accommodation, Others
    }

    try {
      await window.db
        .collection("Trips").doc(tripId)
        .collection("Itinerary").doc(dayId)
        .collection("Activities").doc(activityId)
        .update({
          Time: newTime,
          Description: newDesc,
          Remarks: newRemarks,
          Address: newAddress,
          About: newAbout,
          Tag: newTag
        });

      // 🔑 Re-fetch the latest activities for this day
      const activitiesSnap = await window.db
        .collection("Trips").doc(tripId)
        .collection("Itinerary").doc(dayId)
        .collection("Activities")
        .orderBy("Order")
        .get();
      
      days[window.dayIndex].activities = activitiesSnap.docs.map(actDoc => {
        const actData = actDoc.data();
        return {
          id: actDoc.id,
          order: actData.Order ?? 9999,
          time: actData.Time || "",
          description: actData.Description || "",
          address: actData.Address || "",
          remarks: actData.Remarks || "",
          tags: actData.Tag || "",
          about: actData.About || ""
        };
      });
      
      // 🔑 Now rebuild the HTML with fresh data
      window.renderDay(window.dayIndex);
    } catch (err) {
      console.error("Error updating activity:", err);
    } finally {
      editActions.remove();
      actions.style.display = "flex";
      entry.classList.remove("editing");
    }
  });
}
