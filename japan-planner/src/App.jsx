import React, { useEffect, useMemo, useState } from "react";
import { loadActivities, cityForKey, datesInRange } from "./services/activities";
import { loadVotes, allVoters } from "./services/votes";
import { loadPlannerMetadata } from "./services/plannerData";
import { generatePlansForDateRange } from "./algorithm/planner";
import PlanCard from "./components/PlanCard";
import AdminPanel from "./components/AdminPanel";

function formatDateFr(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short", day: "numeric", month: "long"
  });
}

export default function App() {
  const [activities, setActivities] = useState([]);
  const [votes, setVotes] = useState(new Map());
  const [metadata, setMetadata] = useState(new Map());
  const [city, setCity] = useState("osaka");
  const [constraints, setConstraints] = useState([]);
  const [dateResults, setDateResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const admin = new URLSearchParams(location.search).get("admin") === "1";

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const rawActivities = await loadActivities();
      const [loadedVotes, loadedMetadata] = await Promise.all([
        loadVotes(rawActivities.map(a => a.id)), loadPlannerMetadata()
      ]);
      setVotes(loadedVotes);
      setMetadata(loadedMetadata);
      setActivities(rawActivities.map(a => ({
        ...a,
        ...(loadedMetadata.get(a.id) || {}),
        voters: loadedVotes.get(a.id) || []
      })));
    } catch (e) {
      console.error(e);
      setError(e.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  const cityActivities = useMemo(
    () => activities.filter(a => a.city === city),
    [activities, city]
  );

  const cityDates = useMemo(() => datesInRange(city), [city]);
  const people = useMemo(() => allVoters(votes), [votes]);
  const dateConstraint = constraints.find(c => c.type === "date");

  function changeCity(key) {
    setCity(key);
    setConstraints([]);
    setDateResults([]);
  }

  async function generate() {
    setGenerating(true);
    setError("");
    try {
      if (people.length < 2) {
        throw new Error("Il faut au moins deux votants enregistrés dans Firestore.");
      }
      const result = await generatePlansForDateRange({
        activities: cityActivities,
        people,
        dates: cityDates,
        constraints
      });
      setDateResults(result);
    } catch (e) {
      console.error(e);
      setError(e.message || "Impossible de générer les parcours.");
    } finally {
      setGenerating(false);
    }
  }

  function pinDate(date) {
    setConstraints([
      ...constraints.filter(c => c.type !== "date"),
      { type: "date", date, id: crypto.randomUUID() }
    ]);
  }

  function addConstraint() {
    setConstraints([...constraints, { type: "none", id: crypto.randomUUID() }]);
  }

  function updateConstraint(id, patch) {
    setConstraints(constraints.map(c => c.id === id ? { ...c, ...patch } : c));
  }

  function removeConstraint(id) {
    setConstraints(constraints.filter(c => c.id !== id));
  }

  const cities = [
    ["osaka", "Osaka", "18–22 fév."],
    ["nara", "Nara", "22–23 fév."],
    ["kyoto", "Kyoto", "23–26 fév."],
    ["kanazawa", "Kanazawa", "26–28 fév."],
    ["tokyo", "Tokyo", "26 fév.–10 mars"],
    ["fuji", "Fuji Five Lakes", "28 fév.–2 mars"]
  ];

  return (
    <div className="app">
      <header className="hero">
        <a href="/" className="back">← Retour au guide</a>
        <p className="eyebrow">Japon 2027 · outil du groupe</p>
        <h1>Organiser une journée</h1>
        <p>
          {dateConstraint
            ? "Un jour précis est fixé ci-dessous — les propositions détaillées portent uniquement sur celui-ci."
            : "Par défaut, tous les jours du séjour dans la ville sont évalués et classés du meilleur au moins bon."}
        </p>
      </header>

      <main>
        {error && <div className="error">{error}</div>}
        {loading ? <p className="loading">Chargement des activités et des votes…</p> : (
          <>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>1. Choisir la ville</h2>
                  <p>{people.length} votant(s) détecté(s) · {cityActivities.length} activités à {cities.find(c => c[0] === city)?.[1]}</p>
                </div>
              </div>

              <div className="city-tabs">
                {cities.map(([key, label, dates]) => (
                  <button className={city === key ? "active" : ""} key={key} onClick={() => changeCity(key)}>
                    <strong>{label}</strong><span>{dates}</span>
                  </button>
                ))}
              </div>

              <div className="constraint-box">
                <div>
                  <strong>Contraintes</strong>
                  <p>Ajoute un jour précis, une activité obligatoire/exclue, un créneau horaire, ou impose de rester groupé.</p>
                </div>
                <button onClick={addConstraint}>+ Ajouter</button>
              </div>

              {constraints.map((c) => (
                <div className="constraint-row" key={c.id}>
                  <select
                    value={c.type}
                    onChange={e => updateConstraint(c.id, { type: e.target.value })}
                  >
                    <option value="none">Type de contrainte…</option>
                    <option value="date">Jour précis</option>
                    <option value="required">Activité obligatoire</option>
                    <option value="excluded">Activité exclue</option>
                    <option value="timeWindow">Créneau horaire</option>
                    <option value="keepTogether">Rester groupé</option>
                  </select>

                  {c.type === "date" && (
                    <select
                      value={c.date || ""}
                      onChange={e => updateConstraint(c.id, { date: e.target.value })}
                    >
                      <option value="">Choisir un jour</option>
                      {cityDates.map(d => <option key={d} value={d}>{formatDateFr(d)}</option>)}
                    </select>
                  )}

                  {(c.type === "required" || c.type === "excluded") && (
                    <select
                      value={c.activityId || ""}
                      onChange={e => updateConstraint(c.id, { activityId: e.target.value })}
                    >
                      <option value="">Choisir une activité</option>
                      {cityActivities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                    </select>
                  )}

                  {c.type === "timeWindow" && (
                    <div className="time-inputs">
                      <input
                        type="time"
                        placeholder="Après"
                        value={c.after || ""}
                        onChange={e => updateConstraint(c.id, { after: e.target.value })}
                      />
                      <input
                        type="time"
                        placeholder="Avant"
                        value={c.before || ""}
                        onChange={e => updateConstraint(c.id, { before: e.target.value })}
                      />
                    </div>
                  )}

                  <button onClick={() => removeConstraint(c.id)}>×</button>
                </div>
              ))}

              <button className="generate" onClick={generate} disabled={generating}>
                {generating ? "Calcul des parcours…" : "✨ Générer les parcours"}
              </button>
            </section>

            <section className="votes-preview panel">
              <h2>2. Ce que le groupe a voté</h2>
              <div className="vote-grid">
                {cityActivities
                  .map(a => ({ ...a, count: a.voters.length }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 12)
                  .map(a => (
                    <div className="vote-item" key={a.id}>
                      <strong>{a.title}</strong>
                      <span>{a.count}/{people.length} vote(s)</span>
                    </div>
                  ))}
              </div>
            </section>

            {dateResults.length > 1 && (
              <section className="results">
                <div className="results-head">
                  <p className="eyebrow">3. Meilleurs jours pour {cities.find(c => c[0] === city)?.[1]}</p>
                  <h2>Classement sur l'ensemble du séjour</h2>
                </div>
                <ul className="day-overview">
                  {dateResults.map((entry, i) => (
                    <li className={i === 0 ? "best" : ""} key={entry.date}>
                      <div>
                        <div className="day-label">{i === 0 ? "🥇 " : ""}{formatDateFr(entry.date)}</div>
                        <div className="day-summary">
                          {entry.plans[0].peopleSatisfied}/{people.length} satisfaits ·{" "}
                          {entry.plans[0].totalTravelMin} min de déplacements
                        </div>
                      </div>
                      <button onClick={() => pinDate(entry.date)}>Voir le détail</button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {dateResults.length === 1 && (
              <section className="results">
                <div className="results-head">
                  <p className="eyebrow">3. Propositions pour {formatDateFr(dateResults[0].date)}</p>
                  <h2>Les parcours que les votes rendent possibles</h2>
                </div>
                {dateResults[0].plans.map((p, i) => (
                  <PlanCard
                    plan={p}
                    rank={i + 1}
                    totalPeople={people.length}
                    cityName={cities.find(c => c[0] === city)?.[1]}
                    dateLabel={formatDateFr(dateResults[0].date)}
                    key={i}
                  />
                ))}
              </section>
            )}

            {admin && (
              <AdminPanel
                activities={activities}
                metadata={metadata}
                onSaved={reload}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}