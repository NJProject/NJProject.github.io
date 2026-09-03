function fmt(min) {
    const h = String(Math.floor(min / 60)).padStart(2, "0");
    const m = String(min % 60).padStart(2, "0");
    return `${h}:${m}`;
  }
  
  export function downloadPlanAsText(plan, cityName, dateLabel) {
    const lines = [];
    lines.push(`🗾 Parcours — ${cityName} — ${dateLabel}`);
    lines.push(
      plan.groups.length > 1
        ? `${plan.groups.map(g => g.people.length).join(" + ")} personnes · séparation`
        : "Tout le monde ensemble"
    );
    lines.push(`${plan.totalTravelMin} min de déplacements estimés`);
    lines.push("");
  
    plan.groups.forEach((group, i) => {
      if (plan.groups.length > 1) lines.push(`— Groupe ${i + 1} : ${group.people.join(", ")} —`);
      if (group.ordered.length === 0) {
        lines.push("Aucune activité compatible trouvée.");
      } else {
        group.ordered.forEach(item => {
          lines.push(`${fmt(item.start)}–${fmt(item.end)}  ${item.activity.title}${item.travelEstimated ? "  (trajet estimé)" : ""}`);
        });
      }
      lines.push("");
    });
  
    lines.push("— Généré par le planner Japon 2027 —");
  
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parcours-${cityName.toLowerCase()}-${dateLabel.replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }