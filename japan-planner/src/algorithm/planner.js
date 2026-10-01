import { routeBetween } from "../services/routing";
import { getDefaultDuration } from "../services/activities";
import { getLodgingForDate } from "../services/lodgings";

const DEFAULT_DAY_START = 10 * 60;
const DEFAULT_DAY_END = 20 * 60;
const POOL_CAP = 12; // borne le nb de candidats évalués géographiquement par groupe/jour

// Poids de scoring, regroupés ici pour être ajustés facilement en un seul endroit.
const WEIGHTS = {
  VOTE: 25,               // valeur d'un vote du groupe pour une activité
  TRAVEL_COST: 0.85,      // coût par minute de trajet, au choix d'une activité
  IDLE_COST: 0.3,         // coût par minute d'attente avant ouverture
  REQUIRED_BONUS: 500,    // bonus pour une activité marquée "obligatoire"
  DAY_TRAVEL_PENALTY: 0.25, // pénalité par minute de trajet total sur la journée
  SEPARATION_PENALTY: 12,   // pénalité par sous-groupe au-delà du premier
  GROUPING_CONSISTENCY_BONUS: 40, // bonus si la répartition du jour reprend celle d'un jour précédent
  MEAL_TIME_BONUS: 60,     // bonus pour une activité "gastronomie" si son horaire tombe sur un repas
  REQUIRED_PLAN_BONUS: 80, // bonus au plan entier pour chaque activité obligatoire effectivement placée
  CATEGORY_GROUP_STEP_BONUS: 15, // léger coup de pouce, au choix d'une activité, si sa catégorie appartient à un groupe demandé
  CATEGORY_GROUP_PLAN_BONUS: 50  // bonus au plan entier pour chaque groupe de catégories effectivement satisfait
};

const MEAL_WINDOWS = [
  [11 * 60 + 30, 14 * 60],      // déjeuner : 11h30–14h00
  [18 * 60 + 30, 21 * 60]       // dîner : 18h30–21h00
];

function isMealTime(startMin) {
  return MEAL_WINDOWS.some(([from, to]) => startMin >= from && startMin < to);
}

function voters(activity) {
  return new Set(activity.voters || []);
}

function groupVoteScore(activity, group) {
  return group.filter(name => voters(activity).has(name)).length;
}

function satisfaction(activity, group) {
  if (!group.length) return 0;
  return groupVoteScore(activity, group) / group.length;
}

function compatibleWithDate(activity, date) {
  if (!activity.availableDates || !activity.availableDates.length) return true;
  return activity.availableDates.includes(date);
}

function minutesFromHHMM(value) {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function openingWindow(activity, bounds) {
  let open = DEFAULT_DAY_START;
  let close = DEFAULT_DAY_END;
  const h = activity.openingHours;
  if (h && typeof h === "object" && h.open && h.close) {
    open = minutesFromHHMM(h.open);
    close = minutesFromHHMM(h.close);
  }
  if (bounds) {
    if (bounds.after != null) open = Math.max(open, bounds.after);
    if (bounds.before != null) close = Math.min(close, bounds.before);
  }
  return [open, close];
}

function toDepartureDate(dateStr, minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return new Date(`${dateStr}T${h}:${m}:00+09:00`);
}

function separationPenalty(groupCount) {
  return Math.max(0, groupCount - 1) * WEIGHTS.SEPARATION_PENALTY;
}

// Décale le début d'une activité après un créneau "temps libre" imposé s'il
// chevaucherait ce créneau — ne raccourcit jamais la durée de l'activité,
// la repousse entièrement après la pause.
function applyFreeWindow(start, duration, freeWindow) {
  if (!freeWindow) return start;
  const end = start + duration;
  if (end <= freeWindow.from || start >= freeWindow.to) return start;
  return freeWindow.to;
}

// Représentation canonique d'une répartition en sous-groupes, pour comparer
// deux répartitions entre elles indépendamment de l'ordre des groupes ou
// des personnes à l'intérieur de chaque groupe.
function normalizeGrouping(groups) {
  return groups.map(g => [...g].sort().join(",")).sort().join("|");
}

async function buildDayPlan(pool, group, { dateStr, timeBounds, requiredIds = [], startLocation = null, freeWindow = null, flexibleMap = new Map(), categoryGroups = [] } = {}) {
  const remaining = [...pool];
  const ordered = [];
  let current = startLocation ? { location: startLocation } : null;
  let cursor = Math.max(DEFAULT_DAY_START, timeBounds?.after ?? DEFAULT_DAY_START);
  let totalTravel = 0;

  while (remaining.length) {
    let best = null;
    let bestScore = -Infinity;
    let bestRoute = null;
    let bestStart = null;
    let bestDuration = null;

    for (const candidate of remaining) {
      const route = current?.location && candidate.location
        ? await routeBetween(current.location, candidate.location, {
            departureTime: dateStr ? toDepartureDate(dateStr, cursor) : undefined
          })
        : { durationMin: current ? 45 : 0, estimated: true };

      const [open, close] = openingWindow(candidate, timeBounds);
      const dayEnd = timeBounds?.before ?? DEFAULT_DAY_END;
      const effectiveClose = Math.min(close, dayEnd);
      const arrival = cursor + route.durationMin;

      const flex = flexibleMap.get(candidate.id);
      const fixedDuration = candidate.durationMin || getDefaultDuration(candidate.category);
      const provisionalDuration = flex ? (flex.min ?? 30) : fixedDuration;
      const start = applyFreeWindow(Math.max(arrival, open), provisionalDuration, freeWindow);

      let duration = provisionalDuration;
      if (flex) {
        const available = effectiveClose - start;
        const min = flex.min ?? 30;
        const max = flex.max ?? Math.max(min, fixedDuration);
        duration = Math.max(min, Math.min(max, available));
      }

      if (start + duration > effectiveClose) continue; // ne rentre pas dans la journée, même en durée minimale

      const isRequired = requiredIds.includes(candidate.id);
      const voteValue = groupVoteScore(candidate, group) * WEIGHTS.VOTE;
      const travelCost = route.durationMin * WEIGHTS.TRAVEL_COST;
      const idleCost = Math.max(0, start - arrival) * WEIGHTS.IDLE_COST;
      const requiredBonus = isRequired ? WEIGHTS.REQUIRED_BONUS : 0;
      const mealBonus = (candidate.category === "gastronomie" && isMealTime(start)) ? WEIGHTS.MEAL_TIME_BONUS : 0;
      const categoryGroupBonus = categoryGroups.some(cats => cats.includes(candidate.category)) ? WEIGHTS.CATEGORY_GROUP_STEP_BONUS : 0;

      const score = voteValue + requiredBonus + mealBonus + categoryGroupBonus - travelCost - idleCost;

      if (score > bestScore) {
        bestScore = score;
        best = candidate;
        bestRoute = route;
        bestStart = start;
        bestDuration = duration;
      }
    }

    if (!best) break; // plus rien ne rentre dans le temps restant

    ordered.push({
      activity: best,
      start: bestStart,
      end: bestStart + bestDuration,
      travelBeforeMin: bestRoute.durationMin,
      travelEstimated: bestRoute.estimated,
      flexible: flexibleMap.has(best.id)
    });

    totalTravel += bestRoute.durationMin;
    cursor = bestStart + bestDuration;
    current = best;
    remaining.splice(remaining.indexOf(best), 1);
  }

  // [G] Trajet retour vers le logement en fin de journée — absent jusqu'ici,
  // ce qui sous-estimait totalTravelMin/travelRatio (et donc le badge 🟢/🟡/🔴).
  let returnTravelMin = 0;
  let returnEstimated = false;
  if (startLocation && current?.location && ordered.length) {
    const back = await routeBetween(current.location, startLocation, {
      departureTime: dateStr ? toDepartureDate(dateStr, cursor) : undefined
    });
    returnTravelMin = back.durationMin;
    returnEstimated = back.estimated;
    totalTravel += back.durationMin;
  }

  return {
    ordered,
    totalTravelMin: Math.round(totalTravel),
    returnTravelMin: Math.round(returnTravelMin),
    returnEstimated
  };
}

function buildGroupCandidates(activities, people, constraints) {
  const keepTogether = constraints.some(c => c.type === "keepTogether");
  const candidates = [{ groups: [people], label: "Tout le monde" }];
  if (keepTogether) return candidates;

  for (let mask = 1; mask < (1 << people.length) - 1; mask++) {
    const a = people.filter((_, i) => mask & (1 << i));
    const b = people.filter(p => !a.includes(p));
    if (a.length < 2 || b.length < 2) continue;
    const keyA = [...a].sort().join("|");
    const keyB = [...b].sort().join("|");
    if (keyA > keyB) continue;
    candidates.push({ groups: [a, b], label: `${a.length} + ${b.length}` });
    if (candidates.length >= 25) break;
  }

  return candidates;
}

function getTimeBounds(constraints) {
  const c = constraints.find(x => x.type === "timeWindow");
  if (!c) return null;
  return {
    after: c.after ? minutesFromHHMM(c.after) : null,
    before: c.before ? minutesFromHHMM(c.before) : null
  };
}

function getFreeWindow(constraints) {
  const c = constraints.find(x => x.type === "freeTime" && x.from && x.to);
  if (!c) return null;
  return { from: minutesFromHHMM(c.from), to: minutesFromHHMM(c.to) };
}

function getFlexibleMap(constraints) {
  const map = new Map();
  constraints.filter(c => c.type === "flexible" && c.activityId).forEach(c => {
    map.set(c.activityId, {
      min: c.min ? Number(c.min) : 30,
      max: c.max ? Number(c.max) : 180
    });
  });
  return map;
}

// Un groupe de catégories est satisfait dès qu'une activité de l'une de ses
// catégories est placée dans la journée — "Culture OU Gastronomie", jamais "ET".
function getCategoryGroups(constraints) {
  return constraints
    .filter(c => c.type === "categoryGroup" && c.categories?.length)
    .map(c => c.categories);
}

export async function generatePlans({ activities, people, date, constraints = [], extraExcludedIds = new Set(), city = null, preferredGrouping = null }) {
  const excluded = new Set([
    ...constraints.filter(c => c.type === "excluded").flatMap(c => c.activityIds || (c.activityId ? [c.activityId] : [])),
    ...extraExcludedIds
  ]);
  const requiredIds = constraints.filter(c => c.type === "required").flatMap(c => c.activityIds || (c.activityId ? [c.activityId] : []));
  const timeBounds = getTimeBounds(constraints);
  const freeWindow = getFreeWindow(constraints);
  const flexibleMap = getFlexibleMap(constraints);
  const categoryGroups = getCategoryGroups(constraints);

  const relevant = activities
    .filter(a => compatibleWithDate(a, date))
    .filter(a => !excluded.has(a.id));

  const candidates = buildGroupCandidates(relevant, people, constraints);
  const plans = [];

  for (const candidate of candidates) {
    const groupResults = [];
    let score = 0;
    let travel = 0;
    let activeMin = 0;
    // [B] Évite qu'une activité obligatoire soit placée deux fois le même jour
    // dans deux sous-groupes différents (ex. "3+3" visitant le même lieu unique
    // au même moment). Une fois qu'un sous-groupe l'a réellement placée, elle
    // sort du pool des sous-groupes suivants pour ce même candidat de répartition.
    const claimedRequired = new Set();

    for (const group of candidate.groups) {
      let pool = relevant
        .filter(a => a.voters?.some(v => group.includes(v)))
        .filter(a => !a.excluders?.some(v => group.includes(v)))
        .filter(a => !claimedRequired.has(a.id));
      pool.sort((a, b) => groupVoteScore(b, group) - groupVoteScore(a, group));
      pool = pool.slice(0, POOL_CAP);

      // Une activité marquée "obligatoire" doit rester disponible même si elle
      // n'a pas été votée par ce groupe ou est sortie du top 12 — sauf si un
      // sous-groupe précédent l'a déjà réellement placée aujourd'hui.
      requiredIds.forEach(id => {
        if (claimedRequired.has(id)) return;
        if (!pool.some(a => a.id === id)) {
          const forced = relevant.find(a => a.id === id);
          if (forced && !forced.excluders?.some(v => group.includes(v))) pool.push(forced);
        }
      });

      // [D] Repêchage : une activité correspondant à un groupe de catégories
      // demandé doit rester une candidate potentielle même sans aucun vote de
      // ce sous-groupe et même hors du top 12 — sinon le bonus "groupe de
      // catégories" ne peut jamais s'appliquer à elle (le pool, trié par votes
      // et tronqué juste au-dessus, l'exclurait systématiquement).
      categoryGroups.forEach(cats => {
        const alreadyCovered = pool.some(a => cats.includes(a.category));
        if (alreadyCovered) return;
        const bestMatch = relevant
          .filter(a => cats.includes(a.category))
          .filter(a => !a.excluders?.some(v => group.includes(v)))
          .filter(a => !claimedRequired.has(a.id))
          .sort((a, b) => groupVoteScore(b, group) - groupVoteScore(a, group))[0];
        if (bestMatch && !pool.some(a => a.id === bestMatch.id)) pool.push(bestMatch);
      });

      const startLocation = city ? getLodgingForDate(city, date) : null;
      const result = await buildDayPlan(pool, group, { dateStr: date, timeBounds, requiredIds, startLocation, freeWindow, flexibleMap, categoryGroups });

      result.ordered.forEach(item => {
        if (requiredIds.includes(item.activity.id)) claimedRequired.add(item.activity.id);
      });

      const satisfactionScore = result.ordered.length
        ? result.ordered.reduce((sum, item) => sum + satisfaction(item.activity, group), 0) / result.ordered.length
        : 0;

      groupResults.push({ people: group, satisfaction: satisfactionScore, ...result });
      score += satisfactionScore * 100;
      travel += result.totalTravelMin;
      activeMin += result.ordered.reduce((sum, item) => sum + (item.end - item.start), 0);
    }

    const scheduledIds = new Set(groupResults.flatMap(g => g.ordered.map(item => item.activity.id)));
    const requiredPlaced = requiredIds.filter(id => scheduledIds.has(id)).length;
    score += requiredPlaced * WEIGHTS.REQUIRED_PLAN_BONUS;

    // [C] Expose le statut réel de chaque activité obligatoire — jusqu'ici
    // "requiredPlaced" n'existait que pour le score, invisible à l'utilisateur.
    const requiredResults = requiredIds.map(id => {
      const activity = activities.find(a => a.id === id) || relevant.find(a => a.id === id);
      return { id, title: activity?.title || id, placed: scheduledIds.has(id) };
    });

    const scheduledCategories = new Set(groupResults.flatMap(g => g.ordered.map(item => item.activity.category)));
    const categoryGroupResults = categoryGroups.map(cats => ({
      categories: cats,
      satisfied: cats.some(cat => scheduledCategories.has(cat))
    }));
    score += categoryGroupResults.filter(r => r.satisfied).length * WEIGHTS.CATEGORY_GROUP_PLAN_BONUS;

    score -= travel * WEIGHTS.DAY_TRAVEL_PENALTY;
    score -= separationPenalty(candidate.groups.length);

    if (preferredGrouping && candidate.groups.length > 1
      && normalizeGrouping(candidate.groups) === normalizeGrouping(preferredGrouping)) {
      score += WEIGHTS.GROUPING_CONSISTENCY_BONUS;
    }

    const travelRatio = (travel + activeMin) > 0 ? travel / (travel + activeMin) : 0;

    plans.push({
      label: candidate.label,
      date,
      groups: groupResults,
      score,
      totalTravelMin: travel,
      travelRatio,
      categoryGroupResults,
      requiredResults,
      peopleSatisfied: new Set(groupResults.flatMap(g =>
        g.people.filter(person => g.ordered.some(item => voters(item.activity).has(person)))
      )).size
    });
  }

  return plans
    .sort((a, b) => b.score - a.score)
    .filter((plan, index, arr) => index === 0 || Math.abs(plan.score - arr[index - 1].score) > 2)
    .slice(0, 3);
}

// Évalue chaque jour du séjour (ou uniquement le jour imposé par une contrainte "date")
// et classe les jours du meilleur au moins bon.
export async function generatePlansForDateRange({ activities, people, dates, constraints = [], city = null }) {
  const dateConstraint = constraints.find(c => c.type === "date" && c.date);
  const datesToTry = dateConstraint ? [dateConstraint.date] : dates;

  const perDate = [];
  for (const date of datesToTry) {
    const plans = await generatePlans({ activities, people, date, constraints, city });
    if (plans.length) perDate.push({ date, plans, topScore: plans[0].score });
  }

  return perDate.sort((a, b) => b.topScore - a.topScore);
}

// Enchaîne plusieurs jours choisis, dans l'ordre chronologique, en excluant
// au fil de l'eau les activités déjà casées un jour précédent — évite les
// doublons sur un séjour de plusieurs jours dans la même ville.
export async function generateMultiDayPlan({ activities, people, dates, constraints = [], city = null }) {
  const sortedDates = [...dates].sort();
  const used = new Set();
  const days = [];
  let lastGrouping = null; // répartition en sous-groupes du dernier jour séparé, pour la cohérence inter-jours

  // [M] Une fois un groupe de catégories satisfait un jour du programme, il
  // ne doit plus être redemandé/réévalué "non satisfait" les jours suivants —
  // comportement désormais aligné sur celui de "required", qui bénéficiait
  // déjà de cet effet via l'exclusion des activités utilisées (ci-dessous).
  const satisfiedGroupKeys = new Set();
  function groupKey(cats) {
    return [...cats].sort().join("|");
  }

  for (const date of sortedDates) {
    const dayConstraints = constraints.filter(c =>
      !(c.type === "categoryGroup" && c.categories?.length && satisfiedGroupKeys.has(groupKey(c.categories)))
    );

    const plans = await generatePlans({ activities, people, date, constraints: dayConstraints, extraExcludedIds: used, city, preferredGrouping: lastGrouping });
    if (!plans.length) {
      days.push({ date, plan: null });
      continue;
    }
    const best = plans[0];
    days.push({ date, plan: best });
    best.groups.forEach(g => g.ordered.forEach(item => used.add(item.activity.id)));
    if (best.groups.length > 1) {
      lastGrouping = best.groups.map(g => g.people);
    }
    (best.categoryGroupResults || []).forEach(r => {
      if (r.satisfied) satisfiedGroupKeys.add(groupKey(r.categories));
    });
  }

  const validDays = days.filter(d => d.plan);
  return {
    days,
    totalTravelMin: validDays.reduce((sum, d) => sum + d.plan.totalTravelMin, 0),
    avgSatisfaction: validDays.length
      ? validDays.reduce((sum, d) => sum + d.plan.peopleSatisfied, 0) / validDays.length
      : 0
  };
}