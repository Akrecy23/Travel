async function viewItineraryPDF(tripId) {
  // ====== CREATE jsPDF CONSTANT =======
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // ======= REGISTER FONTS ========  
  doc.addFileToVFS("NotoSansTC-Bold.ttf", NotoSansTC);
  doc.addFont("NotoSansTC-Bold.ttf", "NotoSansTC", "normal");
  
  // ===== FETCH TRIP TITLE =====
  const tripSnap = await window.db.collection("Trips").doc(tripId).get();
  const tripData = tripSnap.exists ? tripSnap.data() : {};
  const tripTitle = tripData.title || tripId;

  // ======== PDF CONTENT ==========
  // Header (TripTitle - Itinerary)
  doc.setFontSize(22);
  doc.setFont("NotoSansTC", "normal");
  doc.text(`${tripTitle} – Itinerary`, 105, 20, { align: "center" });
  doc.line(20, 25, 190, 25);

  // Fetch Days in ascending order
  const daysSnap = await window.db.collection("Trips").doc(tripId).collection("Itinerary").get();
  const sortedDays = daysSnap.docs.sort((a, b) => parseInt(a.id.replace("Day", "")) - parseInt(b.id.replace("Day", "")));

  // Fetch activities in each day, in ascending order
  let y = 40;
  for (const dayDoc of sortedDays) {
    const dayData = dayDoc.data();
    const activitiesSnap = await dayDoc.ref.collection("Activities").orderBy("Order").get();
    const activities = activitiesSnap.docs.map(d => d.data());

    // Sub-header pt 1: Day X
    doc.setFontSize(16);
    doc.setFont("NotoSansTC", "normal");
    doc.text(dayDoc.id, 105, y, { align: "center" });
    y += 8;

    // Sub-header pt 2: (date)
    doc.setFontSize(12);
    doc.text(dayData.Date || "", 105, y, { align: "center" });
    y += 10;

    // Table content : itinerary (Time, Desc, Remarks, Addr, About)
    const rows = activities.map(a => {
      // Make address clickable in PDF (open G-maps)
      const address = a.Address || "";
      let mapsUrl = "";
      if (address){
        mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);
      }
      
      return [
        a.Time || "",
        a.Description || "",
        a.Remarks || "",
        mapsUrl
          ? {
              content: address,
              styles: { textColor: [0,0,255], fontStyle: "underline" },
              // IMPORTANT: use 'link' or 'url' depending on version
              url: mapsUrl   // <-- try 'url' instead of 'link'
            }
          : address, // Clickable address
        (a.About === "Food" || a.About === "Activity") ? a.Tag || "" : a.About || ""
      ];
    });

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
        textColor: [0,0,0],
        font: "NotoSansTC",
        fontStyle: "normal"
      }
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.line(20, y, 190, y);
    // Only add a new page if this is not the last day
    if (dayDoc !== sortedDays[sortedDays.length - 1]) {
      doc.addPage();
      y = 40; // reset Y position for the new page
    }
  }

  // ===== Platform-specific handling for showing PDF =====
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (isIOS) {
    // iPhone/iPad
    doc.save(`${tripTitle}-Itinerary.pdf`);
  } else {
    // Desktop/Android
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl);
  }
}
