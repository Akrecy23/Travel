// FUNCTION FOR EDITING OF BACK SIDE OF CARDS (ACTIVITY DETAILS)
async function enableActivityEditing(entry, tripId, dayId, activityId) {
  const timeEl = entry.querySelector(".time");
  const descEl = entry.querySelector(".box-title h4");
  const remarksEl = entry.querySelector(".box p");
  const tagEl = entry.querySelector(".box .tag");

  // Store originals
  const originalTime = timeEl.textContent || "";
  const originalDesc = descEl.textContent || "";
  const originalRemarks = remarksEl.textContent || "";
  const originalTag = tagEl ? tagEl.textContent : "";
  const originalAbout = entry.getAttribute("data-about") || "";

  // Replace with inputs
  timeEl.innerHTML = `<input type="text" class="edit-time" placeholder="(Time)" value="${originalTime}">`;
  descEl.innerHTML = `<input type="text" class="edit-description" placeholder="(Activity Header)" value="${originalDesc}">`;
  remarksEl.innerHTML = `<textarea class="edit-remarks" placeholder="(Remarks)">${originalRemarks}</textarea>`;
  
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
  remarksEl.insertAdjacentHTML("afterend", aboutSelectHTML);

  // Tag dropdown wrapper
  const tagWrapper = document.createElement("div");
  tagWrapper.className = "edit-tag-wrapper";
  tagWrapper.style.marginTop = "0.5rem";
  tagWrapper.style.display = "none";
  tagWrapper.innerHTML = `<select class="edit-tag"></select>`;
  remarksEl.insertAdjacentElement("afterend", tagWrapper);

  const aboutSelect = entry.querySelector(".edit-about");
  const tagSelect = tagWrapper.querySelector(".edit-tag");

  function populateTags(aboutVal) {
    tagSelect.innerHTML = "";
    if (aboutVal === "Food") {
      [
        "Chinese","Japanese","Italian","Indian","Mexican",
        "Korean","Thai","Vegetarian","Seafood","Others"
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
    if (originalTag) {
      tagWrapper.outerHTML = `<span class="tag Default ${originalTag}">${originalTag}</span>`;
    } else {
      tagWrapper.remove();
    }
    aboutSelect.remove();
    editActions.remove();
    actions.style.display = "flex";
  });

  // Save → update Firestore
  editActions.querySelector(".activity-save-btn").addEventListener("click", async () => {
    const newTime = entry.querySelector(".edit-time").value.trim();
    const newDesc = entry.querySelector(".edit-description").value.trim();
    const newRemarks = entry.querySelector(".edit-remarks").value.trim();
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
          About: newAbout,
          Tag: newTag
        });

      // Restore UI
      window.renderDay(window.dayIndex);
    } catch (err) {
      console.error("Error updating activity:", err);
    } finally {
      editActions.remove();
      actions.style.display = "flex";
    }
  });
}

