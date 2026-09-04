import React, { useMemo, useState } from "react";
import { savePlannerMetadata, savePlannerMetadataBulk } from "../services/plannerData";

export default function AdminPanel({ activities, metadata, onSaved }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(activities[0]?.id || "");
  const activity = activities.find(a => a.id === selectedId);
  const existing = metadata.get(selectedId) || {};
  const [form, setForm] = useState({});

  const options = useMemo(() => activities.filter(a =>
    `${a.cityName} ${a.title}`.toLowerCase().includes(query.toLowerCase())
  ), [activities, query]);

  function edit(id) {
    setSelectedId(id);
    setForm(metadata.get(id) || {});
  }

  async function save() {
    if (!activity) return;
    const location = form.lat && form.lng
      ? { lat: Number(form.lat), lng: Number(form.lng) }
      : null;
    const data = {
      location,
      durationMin: form.durationMin ? Number(form.durationMin) : null,
      openingHours: form.open && form.close ? { open: form.open, close: form.close } : null,
      availableDates: form.availableDates
        ? form.availableDates.split(",").map(s => s.trim()).filter(Boolean)
        : null
    };
    await savePlannerMetadata(activity.id, data);
    onSaved();
    alert("Données enregistrées.");
  }

  const [bulkText, setBulkText] = useState("");
  const [bulkResult, setBulkResult] = useState(null);
  const [skeletonCity, setSkeletonCity] = useState("osaka");

  function generateSkeleton() {
    const subset = activities.filter(a => a.city === skeletonCity);
    const skeleton = {};
    subset.forEach(a => {
      skeleton[a.id] = {
        _label: a.title,
        location: a.location || null,
        durationMin: a.durationMin || null,
        openingHours: a.openingHours || null
      };
    });
    setBulkText(JSON.stringify(skeleton, null, 2));
  }

  async function importBulk() {
    let parsed;
    try {
      parsed = JSON.parse(bulkText);
    } catch {
      alert("JSON invalide — vérifie la syntaxe (virgules, guillemets).");
      return;
    }
    const result = await savePlannerMetadataBulk(parsed);
    setBulkResult(result);
    onSaved();
  }
  
  const current = { ...existing, ...form };
  return (
    <section className="admin">
      <h2>Administration des activités</h2>
      <p className="muted">
        Les pages de villes restent la source du contenu. Ici on ajoute uniquement
        les données nécessaires au planner : coordonnées, durée, horaires et dates.
      </p>
      <input
        className="search"
        placeholder="Rechercher une activité…"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
            <details className="bulk-import">
        <summary>📋 Import groupé (coller un JSON)</summary>
        <p className="muted">
          Choisis une ville pour générer automatiquement le squelette avec les bons identifiants,
          puis complète les coordonnées GPS (clic droit sur Google Maps → copier les coordonnées)
          et la durée en minutes.
        </p>

        <div className="skeleton-row">
          <select value={skeletonCity} onChange={e => setSkeletonCity(e.target.value)}>
            <option value="osaka">Osaka</option>
            <option value="nara">Nara</option>
            <option value="kyoto">Kyoto</option>
            <option value="kanazawa">Kanazawa</option>
            <option value="tokyo">Tokyo</option>
            <option value="fuji">Fuji Five Lakes</option>
          </select>
          <button onClick={generateSkeleton}>Générer le squelette</button>
        </div>

        <p className="muted">
          Le champ <code>_label</code> est juste un repère pour toi (le titre du lieu) — tu peux le laisser,
          il n'a aucun effet sur le planner. Seuls <code>location</code>, <code>durationMin</code> et <code>openingHours</code> comptent.
        </p>

        <textarea
          rows={10}
          placeholder={`{"osaka--chateau-d-osaka": {"_label":"Château d’Osaka","location":{"lat":34.6873,"lng":135.5259},"durationMin":90}}`}          value={bulkText}
          onChange={e => setBulkText(e.target.value)}
        />
        <button className="primary" onClick={importBulk}>Importer</button>
        {bulkResult && (
          <p className="bulk-result">
            ✅ {bulkResult.ok.length} importé(s)
            {bulkResult.failed.length > 0 && ` · ❌ ${bulkResult.failed.length} échec(s)`}
          </p>
        )}
      </details>
      <div className="admin-grid">
        <div className="activity-list">
          {options.map(a => (
            <button className={a.id === selectedId ? "selected" : ""} key={a.id} onClick={() => edit(a.id)}>
              <strong>{a.title}</strong><span>{a.cityName}</span>
            </button>
          ))}
        </div>
        {activity && (
          <div className="editor">
            <h3>{activity.title}</h3>
            <p>{activity.description}</p>
            <label>Latitude<input value={current.location?.lat ?? current.lat ?? ""} onChange={e => setForm({...form, lat:e.target.value})} /></label>
            <label>Longitude<input value={current.location?.lng ?? current.lng ?? ""} onChange={e => setForm({...form, lng:e.target.value})} /></label>
            <label>Durée estimée (minutes)<input type="number" value={current.durationMin ?? ""} onChange={e => setForm({...form, durationMin:e.target.value})} /></label>
            <div className="two">
              <label>Ouverture<input type="time" value={current.open ?? current.openingHours?.open ?? ""} onChange={e => setForm({...form, open:e.target.value})} /></label>
              <label>Fermeture<input type="time" value={current.close ?? current.openingHours?.close ?? ""} onChange={e => setForm({...form, close:e.target.value})} /></label>
            </div>
            <label>Dates possibles (YYYY-MM-DD, séparées par des virgules)
              <input value={current.availableDates?.join(", ") ?? ""} onChange={e => setForm({...form, availableDates:e.target.value})} />
            </label>
            <button className="primary" onClick={save}>Enregistrer</button>
          </div>
        )}
      </div>
    </section>
  );
}
