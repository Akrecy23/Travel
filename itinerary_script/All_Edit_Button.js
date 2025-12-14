// FUNCTION FOR EDITING OF BACK SIDE OF CARDS (ACTIVITY DETAILS)
async function enableActivityEditing(entry, currentUserId, yearId, countryId, groupId, tripId, dayId, activityId) {
  const timeEl = entry.querySelector(".time");
  const descEl = entry.querySelector(".box-title h4");
  const remarksEl = entry.querySelector(".box p");
  const tagEl = entry.querySelector(".box .tag");

  // Store originals
  const originalTime = timeEl.textContent || "(Time)";
  const originalDesc = descEl.textContent || "(Activity Header)";
  const originalRemarks = remarksEl.textContent || "(Remarks)";
  const originalTag = tagEl ? tagEl.textContent : "(Tag - About)";

  // Replace with inputs
  timeEl.innerHTML = `<input type="text" class="edit-time" value="${originalTime}">`;
  descEl.innerHTML = `<input type="text" class="edit-description" value="${originalDesc}">`;
  remarksEl.innerHTML = `<textarea class="edit-remarks">${originalRemarks}</textarea>`;
  if (tagEl) {
    tagEl.outerHTML = `<input type="text" class="edit-tag" value="${originalTag}">`;
  } else {
    remarksEl.insertAdjacentHTML("afterend", `<input type="text" class="edit-tag" placeholder="Enter tag">`);
  }

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
    if (entry.querySelector(".edit-tag")) {
      entry.querySelector(".edit-tag").outerHTML = originalTag
        ? `<span class="tag ${originalTag}">${originalTag}</span>`
        : "";
    }
    editActions.remove();
    actions.style.display = "flex";
  });

  // Save → update Firestore
  editActions.querySelector(".activity-save-btn").addEventListener("click", async () => {
    const newTime = entry.querySelector(".edit-time").value.trim();
    const newDesc = entry.querySelector(".edit-description").value.trim();
    const newRemarks = entry.querySelector(".edit-remarks").value.trim();
    const newTag = entry.querySelector(".edit-tag").value.trim();
    try {
      await window.db
        .collection("User").doc(currentUserId)
        .collection("Year").doc(yearId)
        .collection("Country").doc(countryId)
        .collection("Group").doc(groupId)
        .collection("Trip").doc(tripId)
        .collection("Itinerary").doc(dayId)
        .collection("Activities").doc(activityId)
        .update({
          Time: newTime,
          Description: newDesc,
          Remarks: newRemarks,
          About: newTag
        });

      // Restore UI with new values
      timeEl.textContent = newTime;
      descEl.textContent = newDesc;
      remarksEl.textContent = newRemarks;
      entry.querySelector(".edit-tag").outerHTML = newTag
        ? `<span class="tag Default ${newTag}">${newTag}</span>`
        : "";
    } catch (err) {
      console.error("Error updating activity:", err);
    } finally {
      editActions.remove();
      actions.style.display = "flex";
    }
  });
}