import React, { useEffect, useMemo, useRef, useState } from "react";
import { loadActivities, cityForKey, datesInRange } from "./services/activities";
import { loadVotes, allVoters } from "./services/votes";
import { loadPlannerMetadata } from "./services/plannerData";
import { generatePlansForDateRange, generateMultiDayPlan } from "./algorithm/planner";
import { validateConstraints, summarizeConstraints } from "./algorithm/validateConstraints";
import { getLodgingLabel } from "./services/lodgings";
import { downloadMultiDayPlanAsPdf } from "./utils/exportPlan";
import PlanCard from "./components/PlanCard";
import AdminPanel from "./components/AdminPanel";

function formatDateFr(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short", day: "numeric", month: "long"
  });
}

function scrollToRef(ref) {
  if (ref.current) {
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function App() {
  const [activities, setActivities] = useState([]);
  const [votes, setVotes] = useState(new Map());
  const [metadata, setMetadata] = useState(new Map());
  const [city, setCity] = useState("osaka");
  const [constraints, setConstraints] = useState([]);
  const [dateResults, setDateResults] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [multiDayResult, setMultiDayResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const admin = useMemo(() => {
    const ADMIN_PASSWORD = "japon2027"; // garde la même valeur que custom-pois.js
    const ADMIN_SESSION_KEY = "adminUnlocked";

    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "1") return true;
    if (new URLSearchParams(location.search).get("admin") !== "1") return false;

    const entered = prompt("Mot de passe admin :");
    if (entered === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      return true;
    }
    return false;
  }, []);

  const resultsRef = useRef(null);

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
  const multiDayConstraint = constraints.find(c => c.type === "multiDay");
  const constraintIssues = useMemo(() => validateConstraints(constraints), [constraints]);
  const constraintSummary = useMemo(() => summarizeConstraints(constraints, cityActivities), [constraints, cityActivities]);

  function changeCity(key) {
    setCity(key);
    setConstraints([]);
    setDateResults([]);
    setSelectedDate(null);
    setMultiDayResult(null);
  }

  async function generate() {
    setGenerating(true);
    setError("");
    setSelectedDate(null);
    setMultiDayResult(null);
    setDateResults([]);
    try {
      if (people.length < 2) {
        throw new Error("Il faut au moins deux votants enregistrés dans Firestore.");
      }

      if (multiDayConstraint?.dates?.length) {
        const result = await generateMultiDayPlan({
          activities: cityActivities,
          people,
          dates: multiDayConstraint.dates,
          constraints,
          city
        });
        setMultiDayResult(result);
      } else {
        const result = await generatePlansForDateRange({
          activities: cityActivities,
          people,
          dates: cityDates,
          constraints,
          city
        });
        setDateResults(result);
      }
      requestAnimationFrame(() => scrollToRef(resultsRef));
    } catch (e) {
      console.error(e);
      setError(e.message || "Impossible de générer les parcours.");
    } finally {
      setGenerating(false);
    }
  }

  function viewDay(date) {
    setSelectedDate(date);
    requestAnimationFrame(() => scrollToRef(resultsRef));
  }

  function backToOverview() {
    setSelectedDate(null);
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

  function toggleMultiDayDate(id, date, currentDates) {
    const set = new Set(currentDates || []);
    if (set.has(date)) set.delete(date); else set.add(date);
    updateConstraint(id, { dates: [...set].sort() });
  }

  function selectAllMultiDayDates(id) {
    updateConstraint(id, { dates: [...cityDates] });
  }

  const cities = [
    ["osaka", "Osaka", "18–22 fév."],
    ["nara", "Nara", "22–23 fév."],
    ["kyoto", "Kyoto", "23–26 fév."],
    ["kanazawa", "Kanazawa", "26–28 fév."],
    ["tokyo", "Tokyo", "26 fév.–10 mars"],
    ["fuji", "Fuji Five Lakes", "28 fév.–2 mars"],
    ["excursions", "Excursions", "26 fév.–10 mars"]
  ];
  const cityName = cities.find(c => c[0] === city)?.[1];

  const activeDate = dateConstraint?.date
    || selectedDate
    || (dateResults.length === 1 ? dateResults[0].date : null);

  const activeEntry = activeDate ? dateResults.find(d => d.date === activeDate) : null;
  const showOverview = dateResults.length > 1 && !activeEntry;
  const canGoBack = dateResults.length > 1 && !!activeEntry && !dateConstraint;

  return (
    <div className="app">
      <header className="hero">
        <a href="/" className="back">← Retour au guide</a>
        <p className="eyebrow">Japon 2027 · outil du groupe</p>
        <h1>Organiser une journée</h1>
        <p>
          {multiDayConstraint?.dates?.length
            ? `Programme sur ${multiDayConstraint.dates.length} jour(s) — les activités ne se répètent pas d'un jour à l'autre.`
            : dateConstraint
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
                  <p>{people.length} votant(s) détecté(s) · {cityActivities.length} activités à {cityName}</p>
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
                  <p>Ajoute un jour précis, plusieurs jours à enchaîner, une activité obligatoire/exclue, un créneau horaire, ou impose de rester groupé.</p>
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
                    <option value="multiDay">Plusieurs jours</option>
                    <option value="required">Activité obligatoire</option>
                    <option value="excluded">Activité exclue</option>
                    <option value="timeWindow">Créneau horaire</option>
                    <option value="freeTime">Bloquer un créneau (temps libre)</option>
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

                  {c.type === "multiDay" && (
                    <div className="multiday-picker">
                      <div className="multiday-picker-head">
                        <span>{c.dates?.length || 0}/{cityDates.length} jour(s) sélectionné(s)</span>
                        <button type="button" onClick={() => selectAllMultiDayDates(c.id)}>Tout sélectionner</button>
                      </div>
                      <div className="multiday-checkboxes">
                        {cityDates.map(d => (
                          <label key={d} className="multiday-checkbox">
                            <input
                              type="checkbox"
                              checked={(c.dates || []).includes(d)}
                              onChange={() => toggleMultiDayDate(c.id, d, c.dates)}
                            />
                            {formatDateFr(d)}
                          </label>
                        ))}
                      </div>
                    </div>
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

                  
{c.type === "freeTime" && (
                    <div className="time-inputs">
                      <input
                        type="time"
                        placeholder="De"
                        value={c.from || ""}
                        onChange={e => updateConstraint(c.id, { from: e.target.value })}
                      />
                      <input
                        type="time"
                        placeholder="À"
                        value={c.to || ""}
                        onChange={e => updateConstraint(c.id, { to: e.target.value })}
                      />
                    </div>
                  )}

                  <button onClick={() => removeConstraint(c.id)}>×</button>
                </div>
              ))}

{constraintSummary.length > 0 && (
                <div className="constraint-summary">
                  <strong>Contraintes actives :</strong>
                  <ul>
                    {constraintSummary.map((line, i) => <li key={i}>{line}</li>)}
                  </ul>
                </div>
              )}

{constraintIssues.errors.length > 0 && (
                <div className="constraint-issues constraint-errors">
                  {constraintIssues.errors.map((msg, i) => <p key={i}>⚠️ {msg}</p>)}
                </div>
              )}
              {constraintIssues.warnings.length > 0 && (
                <div className="constraint-issues constraint-warnings">
                  {constraintIssues.warnings.map((msg, i) => <p key={i}>ℹ️ {msg}</p>)}
                </div>
              )}

              <button className="generate" onClick={generate} disabled={generating || constraintIssues.errors.length > 0}>
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

            <section className="results" ref={resultsRef}>
              {multiDayResult && (
                <>
                  <div className="results-head">
                    <p className="eyebrow">3. Programme sur {multiDayResult.days.length} jour(s)</p>
                    <h2>{cityName}</h2>
                  </div>
                  <button
                    className="download-plan multiday-download"
                    onClick={() => downloadMultiDayPlanAsPdf(multiDayResult.days, cityName, (date) => getLodgingLabel(city, date))}
                  >
                    📄 Télécharger le programme complet (PDF)
                  </button>
                  {multiDayResult.days.map((day, i) => (
                    <details className="multiday-day" open={i === 0} key={day.date}>
                    <summary>Jour {i + 1} — {formatDateFr(day.date)}</summary>
                    {getLodgingLabel(city, day.date) && (
                      <p className="lodging-note">🏠 Départ estimé depuis : {getLodgingLabel(city, day.date)}</p>
                    )}
                    {day.plan ? (
                      <PlanCard
                        plan={day.plan}
                        rank={1}
                        totalPeople={people.length}
                        cityName={cityName}
                        dateLabel={formatDateFr(day.date)}
                        lodgingLabel={getLodgingLabel(city, day.date)}
                      />
                      ) : (
                        <p className="muted">Aucune proposition possible ce jour avec les contraintes actuelles.</p>
                      )}
                    </details>
                  ))}
                </>
              )}

              {!multiDayResult && showOverview && (
                <>
                  <div className="results-head">
                    <p className="eyebrow">3. Meilleurs jours pour {cityName}</p>
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
                        <button onClick={() => viewDay(entry.date)}>Voir le détail</button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {!multiDayResult && activeEntry && (
                <>
                  <div className="results-head">
                    {canGoBack && (
                      <button className="back-to-overview" onClick={backToOverview}>
                        ← Retour au classement des jours
                      </button>
                    )}
                    <p className="eyebrow">3. Propositions pour {formatDateFr(activeEntry.date)}</p>
                    <h2>Les parcours que les votes rendent possibles</h2>
                    {getLodgingLabel(city, activeEntry.date) && (
                      <p className="lodging-note">🏠 Départ estimé depuis : {getLodgingLabel(city, activeEntry.date)}</p>
                    )}
                  </div>
                  {activeEntry.plans.map((p, i) => (
                    <PlanCard
                    plan={p}
                    rank={i + 1}
                    totalPeople={people.length}
                    cityName={cityName}
                    dateLabel={formatDateFr(activeEntry.date)}
                    lodgingLabel={getLodgingLabel(city, activeEntry.date)}
                    key={i}
                  />
                  ))}
                </>
              )}
            </section>

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