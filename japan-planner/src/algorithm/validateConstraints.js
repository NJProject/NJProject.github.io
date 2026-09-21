export function validateConstraints(constraints) {
    const errors = [];
    const warnings = [];
  
    const dateC = constraints.find(c => c.type === "date");
    const multiDayC = constraints.find(c => c.type === "multiDay");
    if (dateC?.date && multiDayC?.dates?.length) {
      errors.push("Un jour précis et une planification multi-jours sont actifs en même temps — la première sera ignorée. Retire l'une des deux contraintes.");
    }
  
    const requiredIds = new Set(constraints.filter(c => c.type === "required" && c.activityId).map(c => c.activityId));
    const excludedIds = new Set(constraints.filter(c => c.type === "excluded" && c.activityId).map(c => c.activityId));
    for (const id of requiredIds) {
      if (excludedIds.has(id)) {
        errors.push("Une activité est à la fois marquée \"obligatoire\" et \"exclue\" — retire l'une des deux contraintes.");
        break;
      }
    }
  
    const timeWindow = constraints.find(c => c.type === "timeWindow");
    if (timeWindow?.after && timeWindow?.before && timeWindow.after >= timeWindow.before) {
      errors.push("Le créneau horaire global n'a pas de sens : l'heure de fin est avant (ou égale à) l'heure de début.");
    }
  
    const freeTime = constraints.find(c => c.type === "freeTime");
    if (freeTime?.from && freeTime?.to) {
      if (freeTime.from >= freeTime.to) {
        errors.push("Le créneau \"temps libre\" n'a pas de sens : l'heure de fin est avant (ou égale à) l'heure de début.");
      } else if (timeWindow?.after && freeTime.from < timeWindow.after) {
        warnings.push("Le créneau \"temps libre\" commence avant le début de journée imposé par le créneau horaire — il sera automatiquement recadré.");
      } else if (timeWindow?.before && freeTime.to > timeWindow.before) {
        warnings.push("Le créneau \"temps libre\" dépasse la fin de journée imposée par le créneau horaire — il sera automatiquement recadré.");
      }
    }
  
    constraints.forEach(c => {
      if (c.type === "none") warnings.push("Une contrainte est ajoutée mais aucun type n'est choisi — elle sera ignorée.");
      if (c.type === "date" && !c.date) warnings.push("Une contrainte \"Jour précis\" est ajoutée mais aucun jour n'est choisi — elle sera ignorée.");
      if (c.type === "multiDay" && !(c.dates?.length)) warnings.push("Une contrainte \"Plusieurs jours\" est ajoutée mais aucun jour n'est coché — elle sera ignorée.");
      if ((c.type === "required" || c.type === "excluded") && !c.activityId) {
        warnings.push(`Une contrainte "${c.type === "required" ? "Activité obligatoire" : "Activité exclue"}" est ajoutée mais aucune activité n'est choisie — elle sera ignorée.`);
      }
      if (c.type === "flexible" && !c.activityId) {
        warnings.push("Une contrainte \"Durée libre\" est ajoutée mais aucune activité n'est choisie — elle sera ignorée.");
      }
      if (c.type === "flexible" && c.min && c.max && Number(c.min) >= Number(c.max)) {
        errors.push("Une contrainte \"Durée libre\" a un minimum supérieur ou égal au maximum — corrige les valeurs.");
      }
    });
  
    return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
  }

  function formatDateFr(iso) {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
      weekday: "short", day: "numeric", month: "long"
    });
  }
  
  export function summarizeConstraints(constraints, activities) {
    const lines = [];
  
    const dateC = constraints.find(c => c.type === "date" && c.date);
    if (dateC) lines.push(`📅 Jour fixé : ${formatDateFr(dateC.date)}`);
  
    const multiDayC = constraints.find(c => c.type === "multiDay" && c.dates?.length);
    if (multiDayC) lines.push(`📆 Programme sur ${multiDayC.dates.length} jour(s) enchaînés`);
  
    constraints.filter(c => c.type === "required" && c.activityId).forEach(c => {
      const activity = activities.find(a => a.id === c.activityId);
      if (activity) lines.push(`✅ Obligatoire : ${activity.title}`);
    });
  
    constraints.filter(c => c.type === "excluded" && c.activityId).forEach(c => {
      const activity = activities.find(a => a.id === c.activityId);
      if (activity) lines.push(`🚫 Exclue : ${activity.title}`);
    });
  
    const timeWindow = constraints.find(c => c.type === "timeWindow" && (c.after || c.before));
    if (timeWindow) {
      const parts = [];
      if (timeWindow.after) parts.push(`après ${timeWindow.after}`);
      if (timeWindow.before) parts.push(`avant ${timeWindow.before}`);
      lines.push(`🕐 Créneau horaire : ${parts.join(", ")}`);
    }
  
    const freeTime = constraints.find(c => c.type === "freeTime" && c.from && c.to);
    if (freeTime) lines.push(`☕ Temps libre bloqué : ${freeTime.from}–${freeTime.to}`);
  
    constraints.filter(c => c.type === "flexible" && c.activityId).forEach(c => {
      const activity = activities.find(a => a.id === c.activityId);
      if (activity) lines.push(`🌿 Durée libre : ${activity.title} (${c.min || 30}–${c.max || 180} min)`);
    });
  
    if (constraints.some(c => c.type === "keepTogether")) {
      lines.push(`👥 Le groupe reste ensemble (pas de séparation proposée)`);
    }
  
    return lines;
  }