import { routeBetween } from "../services/routing";
import { getDefaultDuration } from "../services/activities";
import { getLodgingForDate } from "../services/lodgings";

const DEFAULT_DAY_START = 10 * 60;
const DEFAULT_DAY_END = 20 * 60;
const POOL_CAP = 12; // borne le nb de candidats évalués géographiquement par groupe/jour
const GROUPING_CONSISTENCY_BONUS = 40; // bonus si la répartition du jour reprend celle d'un jour précédent

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
  return Math.max(0, groupCount - 1) * 12;
}

/*
 * Construction gloutonne géo-consciente : à chaque étape, on évalue tous les
 * candidats restants (pas seulement un top-5 déjà figé), on calcule le trajet
 * réel depuis l'arrêt précédent, et on choisit celui qui maximise
 * "popularité − coût du trajet − temps d'attente avant ouverture".
 * Les poids (25 / 1.1 / 0.3) sont un point de départ raisonnable avec
 * l'estimation à vol d'oiseau — à recalibrer une fois l'API Google Maps
 * branchée, quand les temps de trajet reflèteront la réalité des transports.
 */

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

async function buildDayPlan(pool, group, { dateStr, timeBounds, requiredIds = [], startLocation = null, freeWindow = null } = {}) {
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

    for (const candidate of remaining) {
      const route = current?.location && candidate.location
        ? await routeBetween(current.location, candidate.location, {
            departureTime: dateStr ? toDepartureDate(dateStr, cursor) : undefined
          })
        : { durationMin: current ? 45 : 0, estimated: true };

      const [open, close] = openingWindow(candidate, timeBounds);
      const dayEnd = timeBounds?.before ?? DEFAULT_DAY_END;
      const arrival = cursor + route.durationMin;
      const duration = candidate.durationMin || getDefaultDuration(candidate.category);
      const start = applyFreeWindow(Math.max(arrival, open), duration, freeWindow);

      if (start + duration > Math.min(close, dayEnd)) continue; // ne rentre pas dans la journée

      const isRequired = requiredIds.includes(candidate.id);
      const voteValue = groupVoteScore(candidate, group) * 25;
      const travelCost = route.durationMin * 1.1;
      const idleCost = Math.max(0, start - arrival) * 0.3;
      const requiredBonus = isRequired ? 500 : 0;

      const score = voteValue + requiredBonus - travelCost - idleCost;

      if (score > bestScore) {
        bestScore = score;
        best = candidate;
        bestRoute = route;
        bestStart = start;
      }
    }

    if (!best) break; // plus rien ne rentre dans le temps restant

    const duration = best.durationMin || getDefaultDuration(best.category);
    ordered.push({
      activity: best,
      start: bestStart,
      end: bestStart + duration,
      travelBeforeMin: bestRoute.durationMin,
      travelEstimated: bestRoute.estimated
    });

    totalTravel += bestRoute.durationMin;
    cursor = bestStart + duration;
    current = best;
    remaining.splice(remaining.indexOf(best), 1);
  }

  return { ordered, totalTravelMin: Math.round(totalTravel) };
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

export async function generatePlans({ activities, people, date, constraints = [], extraExcludedIds = new Set(), city = null, preferredGrouping = null }) {
  const excluded = new Set([
    ...constraints.filter(c => c.type === "excluded" && c.activityId).map(c => c.activityId),
    ...extraExcludedIds
  ]);
  const requiredIds = constraints.filter(c => c.type === "required" && c.activityId).map(c => c.activityId);
  const timeBounds = getTimeBounds(constraints);
  const freeWindow = getFreeWindow(constraints);

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

    for (const group of candidate.groups) {
      let pool = relevant.filter(a => a.voters?.some(v => group.includes(v)));
      pool.sort((a, b) => groupVoteScore(b, group) - groupVoteScore(a, group));
      pool = pool.slice(0, POOL_CAP);

      // Une activité marquée "obligatoire" doit rester disponible même si elle
      // n'a pas été votée par ce groupe ou est sortie du top 12.
      requiredIds.forEach(id => {
        if (!pool.some(a => a.id === id)) {
          const forced = relevant.find(a => a.id === id);
          if (forced) pool.push(forced);
        }
      });

      const startLocation = city ? getLodgingForDate(city, date) : null;
      const result = await buildDayPlan(pool, group, { dateStr: date, timeBounds, requiredIds, startLocation, freeWindow });
      const satisfactionScore = result.ordered.length
        ? result.ordered.reduce((sum, item) => sum + satisfaction(item.activity, group), 0) / result.ordered.length
        : 0;

      groupResults.push({ people: group, satisfaction: satisfactionScore, ...result });
      score += satisfactionScore * 100;
      travel += result.totalTravelMin;
      activeMin += result.ordered.reduce((sum, item) => sum + (item.end - item.start), 0);
    }

    score -= travel * 0.35;
    score -= separationPenalty(candidate.groups.length);

    if (preferredGrouping && candidate.groups.length > 1
        && normalizeGrouping(candidate.groups) === normalizeGrouping(preferredGrouping)) {
      score += GROUPING_CONSISTENCY_BONUS;
    }

    const travelRatio = (travel + activeMin) > 0 ? travel / (travel + activeMin) : 0;

    plans.push({
      label: candidate.label,
      date,
      groups: groupResults,
      score,
      totalTravelMin: travel,
      travelRatio,
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

  for (const date of sortedDates) {
    const plans = await generatePlans({ activities, people, date, constraints, extraExcludedIds: used, city, preferredGrouping: lastGrouping });
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