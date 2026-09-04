import React from "react";
import { downloadPlanAsPdf } from "../utils/exportPlan";

function travelQuality(ratio) {
  if (ratio < 0.15) return { level: "good", label: "🟢 Trajets compacts" };
  if (ratio < 0.3) return { level: "ok", label: "🟡 Trajets modérés" };
  return { level: "bad", label: "🔴 Beaucoup de trajets" };
}

function fmt(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function PlanCard({ plan, rank, totalPeople, cityName, dateLabel }) {
  return (
    <article className={`plan-card rank-${rank}`}>
      <header>
        <div>
          <span className="rank">#{rank}</span>
          <h2>{rank === 1 ? "Meilleur compromis" : rank === 2 ? "Alternative" : "Alternative plus légère"}</h2>
        </div>
        <strong>{plan.peopleSatisfied}/{totalPeople} satisfaits</strong>
      </header>

      <div className={`travel-quality tq-${travelQuality(plan.travelRatio).level}`}>
        {travelQuality(plan.travelRatio).label} · {plan.totalTravelMin} min de trajets
      </div>

      <button
        type="button"
        className="download-plan"
        onClick={() => downloadPlanAsPdf(plan, cityName, dateLabel)}
      >
        📄 Télécharger en PDF
      </button>

      <p className="plan-summary">
        {plan.groups.length > 1
          ? `${plan.groups.map(g => g.people.length).join(" + ")} personnes · séparation proposée`
          : "Tout le monde reste ensemble"}
        {" · "}
        {plan.totalTravelMin} min de déplacements estimés
      </p>

      {plan.groups.map((group, index) => (
        <section className="group" key={index}>
          <h3>👥 {group.people.join(", ")}</h3>
          {group.ordered.length === 0 ? (
            <p>Aucune activité compatible trouvée.</p>
          ) : (
            <ol className="timeline">
              {group.ordered.map((item) => (
                <li key={item.activity.id}>
                  <div className="time">{fmt(item.start)} – {fmt(item.end)}</div>
                  <div className="activity">
                    <strong>{item.activity.title}</strong>
                    <span>{item.activity.cityName} · {item.travelBeforeMin} min de trajet avant</span>
                    {item.travelEstimated && <small>Trajet estimé — coordonnées/API à compléter</small>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
    </article>
  );
}
