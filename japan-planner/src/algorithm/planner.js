import { routeBetween } from "../services/routing";

const DEFAULT_DURATION = 90;
const DEFAULT_DAY_START = 10 * 60;
const DEFAULT_DAY_END = 20 * 60;

function voters(activity) {
  return new Set(activity.voters || []);
}

function satisfaction(activity, group) {
  if (!group.length) return 0;
  const yes = group.filter(name => voters(activity).has(name)).length;
  return yes / group.length;
}

function averageVoteScore(activity, group) {
  if (!group.length) return 0;
  return group.reduce((sum, name) => sum + (voters(activity).has(name) ? 1 : 0), 0);
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

function distancePenalty(routeMinutes) {
  return Math.min(30, routeMinutes / 10);
}

function separationPenalty(groupCount) {
  return Math.max(0, groupCount - 1) * 12;
}

function toDepartureDate(dateStr, minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return new Date(`${dateStr}T${h}:${m}:00+09:00`);
}

async function orderActivities(activities, { dayStart = DEFAULT_DAY_START, dateStr = null, timeBounds = null } = {}) {
  const remaining = [...activities];
  const ordered = [];
  let current = null;
  let totalTravel = 0;
  let cursor = Math.max(dayStart, timeBounds?.after ?? dayStart);

  while (remaining.length) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const route = current?.location && candidate.location
        ? await routeBetween(current.location, candidate.location, {
            departureTime: dateStr ? toDepartureDate(dateStr, cursor) : undefined
          })
        : { durationMin: current ? 60 : 0, estimated: true };

      const [open, close] = openingWindow(candidate, timeBounds);
      const start = Math.max(cursor + route.durationMin, open);
      const duration = candidate.durationMin || DEFAULT_DURATION;
      if (start + duration > close) continue;

      const score = averageVoteScore(candidate, activities.flatMap(a => a.voters || []))
        - distancePenalty(route.durationMin)
        - Math.max(0, start - cursor) / 60;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    const candidate = remaining.splice(bestIndex, 1)[0];
    const route = current?.location && candidate.location
      ? await routeBetween(current.location, candidate.location, {
          departureTime: dateStr ? toDepartureDate(dateStr, cursor) : undefined
        })
      : { durationMin: current ? 60 : 0, distanceKm: null, estimated: true };

    const [open] = openingWindow(candidate, timeBounds);
    const start = Math.max(cursor + route.durationMin, open);
    const duration = candidate.durationMin || DEFAULT_DURATION;

    ordered.push({
      activity: candidate,
      start,
      end: start + duration,
      travelBeforeMin: route.durationMin,
      travelEstimated: route.estimated
    });

    totalTravel += route.durationMin;
    cursor = start + duration;
    current = candidate;
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

function selectActivitiesForGroup(activities, group, date, excluded) {
  return activities
    .filter(a => compatibleWithDate(a, date))
    .filter(a => !excluded.has(a.id))
    .filter(a => a.voters?.some(v => group.includes(v)))
    .sort((a, b) => satisfaction(b, group) - satisfaction(a, group))
    .slice(0, 5);
}

function getTimeBounds(constraints) {
  const c = constraints.find(x => x.type === "timeWindow");
  if (!c) return null;
  return {
    after: c.after ? minutesFromHHMM(c.after) : null,
    before: c.before ? minutesFromHHMM(c.before) : null
  };
}

export async function generatePlans({ activities, people, date, constraints = [] }) {
  const excluded = new Set(constraints.filter(c => c.type === "excluded" && c.activityId).map(c => c.activityId));
  const timeBounds = getTimeBounds(constraints);

  const relevant = activities
    .filter(a => compatibleWithDate(a, date))
    .filter(a => !excluded.has(a.id));

  const candidates = buildGroupCandidates(relevant, people, constraints);
  const plans = [];

  for (const candidate of candidates) {
    const groupResults = [];
    let score = 0;
    let travel = 0;

    for (const group of candidate.groups) {
      let selected = selectActivitiesForGroup(relevant, group, date, excluded);

      for (const constraint of constraints) {
        if (constraint.type === "required" && constraint.activityId) {
          const required = relevant.find(a => a.id === constraint.activityId);
          if (required && !selected.some(a => a.id === required.id)) {
            selected = [required, ...selected].slice(0, 5);
          }
        }
      }

      const result = await orderActivities(selected, { dateStr: date, timeBounds });
      const satisfactionScore = selected.length
        ? selected.reduce((sum, a) => sum + satisfaction(a, group), 0) / selected.length
        : 0;

      groupResults.push({ people: group, satisfaction: satisfactionScore, ...result });
      score += satisfactionScore * 100;
      travel += result.totalTravelMin;
    }

    score -= travel * 0.35;
    score -= separationPenalty(candidate.groups.length);

    plans.push({
      label: candidate.label,
      date,
      groups: groupResults,
      score,
      totalTravelMin: travel,
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
export async function generatePlansForDateRange({ activities, people, dates, constraints = [] }) {
  const dateConstraint = constraints.find(c => c.type === "date" && c.date);
  const datesToTry = dateConstraint ? [dateConstraint.date] : dates;

  const perDate = [];
  for (const date of datesToTry) {
    const plans = await generatePlans({ activities, people, date, constraints });
    if (plans.length) perDate.push({ date, plans, topScore: plans[0].score });
  }

  return perDate.sort((a, b) => b.topScore - a.topScore);
}