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

    // Example: upload to Firebase Storage
    try {
      console.log("Current UID:", firebase.auth().currentUser?.uid);
      const uniqueName = Date.now() + "_" + file.name;
      const storageRef = window.storage
        .ref(`receipts/${tripId}/${expenseId}/${spendingId}/${uniqueName}`);

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

          // Optionally save the URL back into Firestore
          await window.db
            .collection("Trips").doc(tripId)
            .collection("Expenses").doc(expenseId)
            .collection("Spendings").doc(spendingId)
            .update({ receiptPaths: firebase.firestore.FieldValue.arrayUnion(path) });

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
    const receiptPaths = data.receiptPaths || [];

    if (receiptPaths.length === 0) {
      alert("No file uploaded for this spending.");
      return;
    }

    const container = document.querySelector(".receipts-container");
    container.innerHTML = ""; // clear old thumbnails

    for (const path of receiptPaths) {
      const fileRef = window.storage.ref(path);
      const url = await fileRef.getDownloadURL();

      const img = document.createElement("img");
      img.src = url;
      img.className = "receipt-thumb";

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.onclick = () => deleteReceiptImage(spendingDoc.ref, path);

      // Platform-specific view
      img.onclick = () => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
          const link = document.createElement("a");
          link.href = url;
          link.download = "receipt.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          window.open(url, "_blank");
        }
      };

      container.appendChild(img);
      container.appendChild(delBtn);
    }
  } catch (err) {
    console.error("Error fetching receipts:", err);
    alert("Could not load receipts.");
  }
}

// ======== DELETE IMAGE ==========
async function deleteReceiptImage(spendingRef, path) {
  try {
    // Delete from Storage
    await window.storage.ref(path).delete();

    // Remove from Firestore array
    await spendingRef.update({
      receiptPaths: firebase.firestore.FieldValue.arrayRemove(path)
    });

    alert("Image deleted successfully.");
    // Optionally refresh the view
    // handleImageClick(expenseId, tripId, spendingId);
  } catch (err) {
    console.error("Error deleting image:", err);
    alert("Could not delete image.");
  }
}
