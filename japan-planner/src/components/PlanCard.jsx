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

function formatDuration(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function formatCategoryLabel(slug) {
  if (!slug) return slug;
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/_/g, " ");
}

export default function PlanCard({ plan, rank, totalPeople, cityName, dateLabel, lodgingLabel }) {
  const totalActivities = plan.groups.reduce((sum, g) => sum + g.ordered.length, 0);
  const categoryGroupResults = plan.categoryGroupResults || [];

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
        onClick={() => downloadPlanAsPdf(plan, cityName, dateLabel, lodgingLabel)}
      >
        📄 Télécharger en PDF
      </button>

      <ul className="plan-checklist">
        <li className="ok">✓ {plan.peopleSatisfied}/{totalPeople} personnes satisfaites</li>
        <li className="ok">✓ {totalActivities} activité{totalActivities > 1 ? "s" : ""}</li>
        <li className="ok">✓ {formatDuration(plan.totalTravelMin)} de déplacements</li>
        <li className="ok">
          ✓ {plan.groups.length > 1
            ? `Groupe séparé en ${plan.groups.map(g => g.people.length).join(" + ")}`
            : "Tout le monde reste ensemble"}
        </li>
        {(plan.requiredResults || []).map((r, i) => (
          <li className={r.placed ? "ok" : "warn"} key={`req-${i}`}>
            {r.placed ? "✓" : "⚠️"} Obligatoire : {r.title}{r.placed ? "" : " — n'a pas pu être placée"}
          </li>
        ))}
        {categoryGroupResults.map((r, i) => (
          <li className={r.satisfied ? "ok" : "warn"} key={i}>
            {r.satisfied ? "✓" : "⚠️"} Groupe « {r.categories.map(formatCategoryLabel).join(" ou ")} » {r.satisfied ? "satisfait" : "non satisfait"}
          </li>
        ))}
      </ul>

      {plan.groups.map((group, index) => (
        <section className="group" key={index}>
          <h3>👥 {group.people.join(", ")}</h3>
          {group.ordered.length === 0 ? (
            <p>Aucune activité compatible trouvée.</p>
          ) : (
            <ol className="timeline">
              {group.ordered.map((item, i) => (
                <React.Fragment key={item.activity.id}>
                  {i > 0 && (
                    <li className="timeline-connector">
                      <span>↓ {item.travelBeforeMin} min{item.travelEstimated ? " (estimé)" : ""}</span>
                    </li>
                  )}
                  <li>
                    <div className="time">{fmt(item.start)} – {fmt(item.end)}</div>
                    <div className="activity">
                      <strong>{item.activity.icon ? `${item.activity.icon} ` : ""}{item.activity.title}</strong>
                      <span>{item.activity.cityName}{item.flexible ? " · durée ajustée automatiquement" : ""}</span>
                    </div>
                  </li>
                </React.Fragment>
              ))}
            </ol>
          )}
          {group.returnTravelMin > 0 && (
            <p className="timeline-return">
              ↩ {group.returnTravelMin} min de retour au logement{group.returnEstimated ? " (estimé)" : ""}
            </p>
          )}
        </section>
      ))}
    </article>
  );
}