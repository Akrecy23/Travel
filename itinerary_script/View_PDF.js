async function viewItineraryPDF(tripId) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // ======= REGISTER FONTS ========  
  doc.addFileToVFS("NotoSansTC-Bold.ttf", NotoSansTC);
  doc.addFont("NotoSansTC-Bold.ttf", "NotoSansTC", "normal");
  
  // ===== Fetch Trip Title =====
  const tripSnap = await window.db.collection("Trips").doc(tripId).get();
  const tripData = tripSnap.exists ? tripSnap.data() : {};
  const tripTitle = tripData.title || tripId;

  // ===== Title =====
  doc.setFontSize(22);
  doc.setFont("NotoSansTC", "normal");
  doc.text(`${tripTitle} – Itinerary`, 105, 20, { align: "center" });
  doc.line(20, 25, 190, 25);

  // ===== Fetch Days =====
  const daysSnap = await window.db.collection("Trips").doc(tripId).collection("Itinerary").get();
  const sortedDays = daysSnap.docs.sort((a, b) => parseInt(a.id.replace("Day", "")) - parseInt(b.id.replace("Day", "")));

  let y = 40;
  for (const dayDoc of sortedDays) {
    const dayData = dayDoc.data();
    const activitiesSnap = await dayDoc.ref.collection("Activities").orderBy("Order").get();
    const activities = activitiesSnap.docs.map(d => d.data());

    doc.setFontSize(16);
    doc.setFont("NotoSansTC", "normal");
    doc.text(dayDoc.id, 105, y, { align: "center" });
    y += 8;

    doc.setFontSize(12);
    doc.text(dayData.Date || "", 105, y, { align: "center" });
    y += 10;

    const rows = activities.map(a => [
      a.Time || "",
      a.Description || "",
      a.Remarks || "",
      a.Address || "",
      (a.About === "Food" || a.About === "Activity") ? a.Tag || "" : a.About || ""
    ]);

    doc.autoTable({
      startY: y,
      head: [["Time", "Description", "Remarks", "Address", "About"]],
      body: rows,
      styles: {
        font: "NotoSansTC",
        fontStyle: "normal",
        fontSize: 10,
        overflow: 'linebreak', // enable wrapping
        cellPadding: 2
      },
      columnStyles: {
        3: { // Address column
          cellWidth: 60,          // give it more room
          overflow: 'linebreak'   // force wrap
        }
      },
      headStyles: { 
        fillColor: [200, 200, 200],
        font: "NotoSansTC",
        fontStyle: "bold"
      }
      //,
      // ← CRITICAL: Add this hook to handle Chinese text wrapping
      //didParseCell: function(data) {
        //// For the Address column (index 3)
        //if (data.column.index === 3 && data.cell.raw) {
          //const text = data.cell.raw.toString();
          //// Check if text contains Chinese characters
          //if (/[\u4e00-\u9fff]/.test(text)) {
            //// Force wrapping by adding zero-width spaces every few characters
            //const maxCharsPerLine = 30; // Adjust this based on your column width
            //let wrappedText = '';
            //for (let i = 0; i < text.length; i++) {
              //wrappedText += text[i];
              //// Add a potential break point after certain characters or every N characters
              //if ((i + 1) % maxCharsPerLine === 0) {
                //wrappedText += '\n';
              //}
            //}
            //data.cell.text = [wrappedText];
          //}
        //}
      //}
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.line(20, y, 190, y);
    // Only add a new page if this is not the last day
    if (dayDoc !== sortedDays[sortedDays.length - 1]) {
      doc.addPage();
      y = 40; // reset Y position for the new page
    }
  }

  // ===== Platform-specific handling =====
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (isIOS) {
    // iPhone/iPad → force download
    doc.save(`${tripTitle}-Itinerary.pdf`);
  } else {
    // Desktop/Android → open preview in new tab
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl);
  }
}
