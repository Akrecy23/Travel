// THIS FILE CONTAINS CODE FOR "UPLOAD" & "IMAGE" ICON CLICKED

// ======== RUN WHEN USER CLICKS "UPLOAD" ICON ==========
function handleUploadClick(expenseId, tripId, spendingId) {
  const fileInput = document.getElementById("hiddenFileInput");

  // Reset previous selection
  fileInput.value = "";

  // When user selects a file
  fileInput.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log("Selected file:", file.name);

    try {
      console.log("Selected file:", file.name);

      // 1. Check if an old receipt exists
      const spendingRef = window.db
        .collection("Trips").doc(tripId)
        .collection("Expenses").doc(expenseId)
        .collection("Spendings").doc(spendingId);

      const spendingDoc = await spendingRef.get();
      if (spendingDoc.exists) {
        const oldUrl = spendingDoc.data().receiptUrl;
        if (oldUrl) {
          try {
            const oldRef = window.storage.refFromURL(oldUrl);
            await oldRef.delete();
            console.log("Old receipt deleted from storage.");
          } catch (err) {
            console.warn("Could not delete old receipt:", err);
          }
        }
      }

      // 2. Upload new file to Firebase Storage
      const uniqueName = Date.now() + "_" + file.name;
      const path = `receipts/${tripId}/${expenseId}/${spendingId}/${uniqueName}`;
      const storageRef = window.storage.ref(path);

      const uploadTask = storageRef.put(file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress.toFixed(0) + "% done");
        },
        (error) => {
          console.error("Upload failed:", error);
          alert("Upload failed: " + error.message);
        },
        async () => {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          console.log("File available at:", downloadURL);

          // 3. Save new URL in Firestore
          await spendingRef.update({ receiptUrl: downloadURL });
          alert("Upload complete!");
        }
      );
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  // Trigger the native picker (desktop → file explorer, mobile → camera/library)
  fileInput.click();
}

// ======== RUN WHEN USER CLICKS "IMAGE" ICON ==========
async function handleImageClick(expenseId, tripId, spendingId) {
  try {
    // Get the Spendings doc
    const spendingDoc = await window.db
      .collection("Trips").doc(tripId)
      .collection("Expenses").doc(expenseId)
      .collection("Spendings").doc(spendingId)
      .get();

    if (!spendingDoc.exists) {
      alert("No spending record found.");
      return;
    }

    const data = spendingDoc.data();
    const receiptUrl = data.receiptUrl;

    if (!receiptUrl) {
      alert("No file uploaded for this spending.");
      return;
    }

    // Platform-specific handling for showing image
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
      const link = document.createElement("a");
      link.href = receiptUrl;
      link.download = "receipt.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(receiptUrl, "_blank");
    }
  } catch (err) {
    console.error("Error fetching receipt:", err);
    alert("Could not load receipt.");
  }
}
