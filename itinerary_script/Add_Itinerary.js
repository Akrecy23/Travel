function addItinerary(tripId, dayId, activityCount, dayIndex, days, renderDay) {
  // Build a small modal form overlay
  const formModal = document.createElement("div");
  formModal.className = "activity-form-modal";
  formModal.innerHTML = `
    <div class="form-box">
      <div class="form-header">
        <h3>Add Itinerary for ${dayId}</h3>
        <button class="close-form">✕</button>
      </div>
      <form id="activityForm">
        <label>Time</label>
        <input type="text" name="time" placeholder="e.g. 09:30 AM">
        <label>Description*</label>
        <input type="text" name="description" placeholder="Activity Description/Name" required>
        <label>Address</label>
        <input type="text" name="address" placeholder="Location Address">
        <label>Remarks</label>
        <textarea name="remarks" placeholder="Additional Notes"></textarea>
        <label>About*</label>
        <select name="about" id="aboutSelect" required>
          <option value="Transport">Transport</option>
          <option value="Accommodation">Accommodation</option>
          <option value="Food">Food</option>
          <option value="Activity">Activity</option>
          <option value="Others">Others</option>
        </select>
        <div id="tagWrapper" style="display:none;">
          <label>Tag*</label>
          <select name="tag" id="tagSelect"></select>
        </div>
        <div class="form-actions">
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(formModal);
  // Close form modal
  formModal.querySelector(".close-form").addEventListener("click", () => {
    formModal.remove();
  });
  
  // Show/hide tag input depending on About selection
  const aboutSelect = formModal.querySelector("#aboutSelect");
  const tagWrapper = formModal.querySelector("#tagWrapper");
  const tagSelect = formModal.querySelector("#tagSelect");

  // Populate tag dropdown depending on About selection
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
        tagSelect.appendChild(o);
      });
      tagWrapper.style.display = "block";
      tagSelect.required = true;
    } else if (aboutVal === "Activity") {
      [
        "Workshop","Shopping","Hiking","Museum","Exhibition","Concert",
        "Sports","Beach","Cultural","Relaxation","Others"
      ].forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        tagSelect.appendChild(o);
      });
      tagWrapper.style.display = "block";
      tagSelect.required = true;
    } else {
      tagWrapper.style.display = "none";
      tagSelect.innerHTML = "";
      tagSelect.required = false;
    }
  }

  aboutSelect.addEventListener("change", () => {
    const val = aboutSelect.value;
    populateTags(val)
  });
  
  // Handle form submission
  formModal.querySelector("#activityForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    let time = formData.get("time").trim();
    const description = formData.get("description").trim();
    const address = formData.get("address").trim();
    const remarks = formData.get("remarks").trim();
    const about = formData.get("about");
    let tag = formData.get("tag");
    tag = tag ? tag.trim() : "";

    // For Transport/Accommodation/Others, tag = about
    if (about === "Transport" || about === "Accommodation" || about === "Others") {
      tag = about;
    }

    if (time) {
      // Auto-format shorthand inputs like "930am" or "2pm"
      const shorthandRegex = /^(\d{1,2})(\d{2})?\s?(am|pm)$/i;
      const match = time.match(shorthandRegex);
      if (match) {
        let hour = parseInt(match[1], 10);
        let minutes = match[2] ? match[2] : "00";
        let suffix = match[3].toUpperCase();
        // Pad hour and minutes
        const hourStr = hour < 10 ? "0" + hour : String(hour);
        time = `${hourStr}:${minutes} ${suffix}`;
      } else {
        // Case 2: already has colon but missing space, e.g. "12:33PM"
        const fullRegex = /^(\d{1,2}:[0-5][0-9])\s?(AM|PM)$/i;
        const fullMatch = time.match(fullRegex);
        if (fullMatch) {
          time = `${fullMatch[1]} ${fullMatch[2].toUpperCase()}`;
        }
      }
      // Validate final format: hh:mm AM/PM
      const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
      if (!timeRegex.test(time)) {
          alert("Please enter time in the format hh:mm AM or hh:mm PM (e.g. 09:30 AM).");
          const timeInput = e.target.querySelector("input[name='time']");
          timeInput.value = "";
          timeInput.placeholder = "e.g. 09:30 AM";
          return; // stop submission
      }
    }

    // Save to Firestore
    const activitiesRef = window.db
      .collection("Trips").doc(tripId)
      .collection("Itinerary").doc(dayId)
      .collection("Activities");
      
    const newActRef = activitiesRef.doc();
    await newActRef.set({
      Time: time,
      Description: description,
      Address: address,
      Remarks: remarks,
      About: about,
      Tag: tag,
      Order: activityCount + 1
    });
    // Push new activity to array
    days[dayIndex].activities.push({
      id: newActRef.id,
      time: time,
      description: description,
      address: address,
      remarks: remarks,
      about: about,
      tags: tag,
      order: activityCount + 1
    });

    // Refresh the day view
    formModal.remove();
    renderDay(dayIndex);
  });
}
