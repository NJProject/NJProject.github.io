import React, { useMemo, useState } from "react";
import { savePlannerMetadata } from "../services/plannerData";

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
