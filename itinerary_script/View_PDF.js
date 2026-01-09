async function viewItineraryPDF(tripId) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // ===== Fetch Trip Title =====
  const tripSnap = await window.db.collection("Trips").doc(tripId).get();
  const tripData = tripSnap.exists ? tripSnap.data() : {};
  const tripTitle = tripData.title || tripId;

  // ===== Title =====
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(`${tripTitle} – Itinerary`, 105, 20, { align: "center" });
  doc.line(20, 25, 190, 25); // hr line

  // ===== Fetch Days =====
  const daysSnap = await window.db.collection("Trips").doc(tripId).collection("Itinerary").get();
  const sortedDays = daysSnap.docs.sort((a, b) => parseInt(a.id.replace("Day", "")) - parseInt(b.id.replace("Day", "")));

  let y = 40;
  for (const dayDoc of sortedDays) {
    const dayData = dayDoc.data();
    const activitiesSnap = await dayDoc.ref.collection("Activities").orderBy("Order").get();
    const activities = activitiesSnap.docs.map(d => d.data());

    // Day header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(dayDoc.id, 105, y, { align: "center" });
    y += 8;

    // Date
    doc.setFontSize(12);
    doc.text(dayData.Date || "", 105, y, { align: "center" });
    y += 10;

    // Table rows
    const rows = activities.map(a => [
      a.Time || "",
      a.Description || "",
      a.Remarks || "",
      a.Address || "",
      (a.About === "food" || a.About === "activity") ? a.Tag || "" : a.About || ""
    ]);

    // AutoTable
    doc.autoTable({
      startY: y,
      head: [["Time", "Description", "Remarks", "Address", "About"]],
      body: rows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [200, 200, 200] }
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.line(20, y, 190, y); // hr line
    y += 15;
  }

  // ===== Open in new tab for preview =====
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl); // Browser PDF viewer shows download icon
}
