import { jsPDF } from "jspdf";

const COLORS = {
  ink: [27, 42, 65],
  indigo: [37, 60, 99],
  seal: [178, 58, 46],
  gold: [166, 135, 59],
  muted: [111, 106, 97],
  paper: [250, 248, 243],
  line: [221, 215, 202]
};

function fmt(min) {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function newPage(doc) {
  doc.addPage();
  paintBackground(doc);
  return 22;
}

function paintBackground(doc) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...COLORS.paper);
  doc.rect(0, 0, w, h, "F");
}

export function downloadPlanAsPdf(plan, cityName, dateLabel) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 18;
  let y = 24;

  paintBackground(doc);

  // Sceau rouge circulaire
  doc.setDrawColor(...COLORS.seal);
  doc.setLineWidth(0.6);
  doc.circle(marginX + 6, y - 2, 6.5, "S");
  doc.setTextColor(...COLORS.seal);
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text("印", marginX + 6, y - 0.5, { align: "center" });

  // Titre
  doc.setTextColor(...COLORS.ink);
  doc.setFont("times", "bold");
  doc.setFontSize(19);
  doc.text(`Parcours — ${cityName}`, marginX + 17, y - 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...COLORS.gold);
  doc.text(dateLabel.toUpperCase(), marginX + 17, y + 3);

  y += 12;
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 9;

  // Résumé
  const summary = plan.groups.length > 1
    ? `${plan.groups.map(g => g.people.length).join(" + ")} personnes · séparation proposée`
    : "Tout le monde reste ensemble";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text(`${summary}  ·  ${plan.totalTravelMin} min de déplacements estimés`, marginX, y);
  y += 11;

  plan.groups.forEach((group, gi) => {
    if (y > pageHeight - 35) y = newPage(doc);

    doc.setFont("times", "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(...COLORS.indigo);
    doc.text(
      plan.groups.length > 1 ? `Groupe ${gi + 1} — ${group.people.join(", ")}` : `👥 ${group.people.join(", ")}`,
      marginX, y
    );
    y += 8;

    if (group.ordered.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.muted);
      doc.text("Aucune activité compatible trouvée.", marginX + 4, y);
      y += 10;
      return;
    }

    group.ordered.forEach((item) => {
      if (y > pageHeight - 26) y = newPage(doc);

      doc.setFillColor(...COLORS.indigo);
      doc.roundedRect(marginX, y - 4.4, 24, 6.8, 1.4, 1.4, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.3);
      doc.text(`${fmt(item.start)}–${fmt(item.end)}`, marginX + 12, y, { align: "center" });

      doc.setTextColor(...COLORS.ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text(item.activity.title, marginX + 29, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.3);
      doc.setTextColor(...COLORS.muted);
      const travelNote = `${item.travelBeforeMin} min de trajet avant${item.travelEstimated ? " (estimé)" : ""}`;
      doc.text(travelNote, marginX + 29, y + 4.5);

      y += 11.5;
    });

    y += 5;
  });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Généré par le planner Japon 2027", marginX, pageHeight - 12);

  const safeCity = cityName.toLowerCase().replace(/\s+/g, "-");
  const safeDate = dateLabel.replace(/\s+/g, "-");
  doc.save(`parcours-${safeCity}-${safeDate}.pdf`);
}