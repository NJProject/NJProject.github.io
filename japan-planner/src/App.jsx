import React, { useEffect, useMemo, useState } from "react";
import { loadActivities } from "./services/activities";
import { loadVotes, allVoters } from "./services/votes";
import { loadPlannerMetadata } from "./services/plannerData";
import { generatePlans } from "./algorithm/planner";
import PlanCard from "./components/PlanCard";
import AdminPanel from "./components/AdminPanel";

const INITIAL_DATE = "2027-02-18";

export default function App() {
  const [activities, setActivities] = useState([]);
  const [votes, setVotes] = useState(new Map());
  const [metadata, setMetadata] = useState(new Map());
  const [city, setCity] = useState("osaka");
  const [date, setDate] = useState(INITIAL_DATE);
  const [constraints, setConstraints] = useState([]);
  const [plans, setPlans] = useState([]);
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

  const people = useMemo(() => allVoters(votes), [votes]);

  const cityRange = useMemo(() => {
    if (!cityActivities.length) return null;
    const dates = cityActivities.map(a => a.city === city ? a : null).filter(Boolean);
    return dates[0] ? activities.find(a => a.city === city)?.city : null;
  }, [cityActivities, activities]);

  async function generate() {
    setGenerating(true);
    setError("");
    try {
      if (people.length < 2) {
        throw new Error("Il faut au moins deux votants enregistrés dans Firestore.");
      }
      const result = await generatePlans({
        activities: cityActivities,
        people,
        date,
        constraints
      });
      setPlans(result);
    } catch (e) {
      console.error(e);
      setError(e.message || "Impossible de générer les parcours.");
    } finally {
      setGenerating(false);
    }
  }

  const cities = [
    ["osaka", "Osaka", "18–22 fév."],
    ["nara", "Nara", "22–23 fév."],
    ["kyoto", "Kyoto", "23–26 fév."],
    ["kanazawa", "Kanazawa", "26–28 fév."],
    ["tokyo", "Tokyo", "26 fév.–10 mars"]
  ];

  return (
    <div className="app">
      <header className="hero">
        <a href="/" className="back">← Retour au guide</a>
        <p className="eyebrow">Japon 2027 · outil du groupe</p>
        <h1>Organiser une journée</h1>
        <p>Les votes du groupe servent à proposer des parcours. L'application suggère, vous décidez.</p>
      </header>

      <main>
        {error && <div className="error">{error}</div>}
        {loading ? <p className="loading">Chargement des activités et des votes…</p> : (
          <>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>1. Choisir la journée</h2>
                  <p>{people.length} votant(s) détecté(s) · {cityActivities.length} activités à {cities.find(c => c[0] === city)?.[1]}</p>
                </div>
              </div>

              <div className="city-tabs">
                {cities.map(([key, label, dates]) => (
                  <button className={city === key ? "active" : ""} key={key} onClick={() => { setCity(key); setPlans([]); }}>
                    <strong>{label}</strong><span>{dates}</span>
                  </button>
                ))}
              </div>

              <label className="field">Date
                <input type="date" value={date} onChange={e => { setDate(e.target.value); setPlans([]); }} />
              </label>

              <div className="constraint-box">
                <div>
                  <strong>Contraintes</strong>
                  <p>La V1 réserve les contraintes aux règles ponctuelles et aux activités obligatoires.</p>
                </div>
                <button onClick={() => setConstraints([...constraints, { type: "none", id: crypto.randomUUID() }])}>+ Ajouter</button>
              </div>

              {constraints.map((c, i) => (
                <div className="constraint-row" key={c.id}>
                  <select
                    value={c.type}
                    onChange={e => setConstraints(constraints.map((x,j) => j===i ? {...x, type:e.target.value} : x))}
                  >
                    <option value="none">Type de contrainte…</option>
                    <option value="required">Activité obligatoire</option>
                  </select>
                  {c.type === "required" && (
                    <select
                      value={c.activityId || ""}
                      onChange={e => setConstraints(constraints.map((x,j) => j===i ? {...x, activityId:e.target.value} : x))}
                    >
                      <option value="">Choisir une activité</option>
                      {cityActivities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                    </select>
                  )}
                  <button onClick={() => setConstraints(constraints.filter((_,j) => j!==i))}>×</button>
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
                  .map(a => ({...a, count:a.voters.length}))
                  .sort((a,b)=>b.count-a.count)
                  .slice(0, 12)
                  .map(a => (
                    <div className="vote-item" key={a.id}>
                      <strong>{a.title}</strong>
                      <span>{a.count}/{people.length} vote(s)</span>
                    </div>
                  ))}
              </div>
            </section>

            {plans.length > 0 && (
              <section className="results">
                <div className="results-head">
                  <div>
                    <p className="eyebrow">3. Propositions</p>
                    <h2>Les parcours que les votes rendent possibles</h2>
                  </div>
                </div>
                {plans.map((p, i) => <PlanCard plan={p} rank={i+1} totalPeople={people.length} key={i} />)}
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
