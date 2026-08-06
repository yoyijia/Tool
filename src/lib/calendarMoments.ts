/** Seasonal / festival / cultural calendar windows (± days from today). */

export interface CalendarMoment {
  id: string;
  title: string;
  category: "festival" | "movie" | "culture" | "sports";
  month: number; // 1-12
  day: number;
  spanDays: number;
  summary: string;
}

const MOMENTS: CalendarMoment[] = [
  { id: "nye", title: "New Year", category: "festival", month: 1, day: 1, spanDays: 3, summary: "Resolutions, resets, year-ahead energy." },
  { id: "mlk", title: "MLK Day", category: "culture", month: 1, day: 20, spanDays: 2, summary: "Purpose, community, and values storytelling." },
  { id: "superbowl", title: "Super Bowl week", category: "sports", month: 2, day: 8, spanDays: 7, summary: "Big-game ads, watch parties, snack culture." },
  { id: "valentine", title: "Valentine’s Day", category: "festival", month: 2, day: 14, spanDays: 7, summary: "Love, gifts, duo content, soft CTAs." },
  { id: "oscars", title: "Awards season / Oscars", category: "movie", month: 3, day: 2, spanDays: 14, summary: "Red carpet, predictions, “that scene” memes." },
  { id: "sxsw", title: "SXSW season", category: "culture", month: 3, day: 10, spanDays: 10, summary: "Innovation, creators, launch week vibes." },
  { id: "stpatrick", title: "St. Patrick’s Day", category: "festival", month: 3, day: 17, spanDays: 3, summary: "Festive green, community meetups." },
  { id: "womens-day", title: "International Women’s Day", category: "culture", month: 3, day: 8, spanDays: 3, summary: "Founder/POV and representation stories." },
  { id: "earth-day", title: "Earth Day", category: "culture", month: 4, day: 22, spanDays: 5, summary: "Sustainability proof and behind-the-scenes." },
  { id: "coachella", title: "Festival season (Coachella)", category: "festival", month: 4, day: 12, spanDays: 14, summary: "Fits checks, FOMO, creator collabs." },
  { id: "mothers", title: "Mother’s Day", category: "festival", month: 5, day: 11, spanDays: 7, summary: "Gift guides, gratitude, family UGC." },
  { id: "memorial", title: "Memorial Day weekend", category: "festival", month: 5, day: 25, spanDays: 4, summary: "Kickoff-to-summer travel and sales." },
  { id: "pride", title: "Pride Month", category: "culture", month: 6, day: 1, spanDays: 30, summary: "Inclusive campaigns — only with real action." },
  { id: "fathers", title: "Father’s Day", category: "festival", month: 6, day: 15, spanDays: 7, summary: "Gift + story content for dads/mentors." },
  { id: "juneteenth", title: "Juneteenth", category: "culture", month: 6, day: 19, spanDays: 3, summary: "Education and community support angles." },
  { id: "summer-blockbuster", title: "Summer blockbuster season", category: "movie", month: 6, day: 20, spanDays: 40, summary: "Movie drop memes, watch-party hooks." },
  { id: "july4", title: "July 4th", category: "festival", month: 7, day: 4, spanDays: 4, summary: "BBQ, travel, long-weekend campaigns." },
  { id: "olympics", title: "Olympic / sports mega-event window", category: "sports", month: 7, day: 15, spanDays: 20, summary: "Underdog stories, peak performance metaphors." },
  { id: "back-to-school", title: "Back to school", category: "culture", month: 8, day: 15, spanDays: 25, summary: "Routines, productivity, student creatives." },
  { id: "labor", title: "Labor Day", category: "festival", month: 9, day: 1, spanDays: 4, summary: "End-of-summer sales and resets." },
  { id: "fall-festivals", title: "Fall festival season", category: "festival", month: 9, day: 20, spanDays: 25, summary: "Aesthetic seasonal content, local events." },
  { id: "halloween", title: "Halloween", category: "festival", month: 10, day: 31, spanDays: 14, summary: "Costumes, spooky POV, limited drops." },
  { id: "diwali", title: "Diwali season", category: "festival", month: 10, day: 20, spanDays: 10, summary: "Light, celebration, gift culture." },
  { id: "thanksgiving", title: "Thanksgiving / Friendsgiving", category: "festival", month: 11, day: 27, spanDays: 7, summary: "Gratitude, gatherings, recipes." },
  { id: "black-friday", title: "Black Friday / Cyber Week", category: "culture", month: 11, day: 28, spanDays: 10, summary: "Offers, urgency, deal explainers." },
  { id: "holiday-movies", title: "Holiday movie season", category: "movie", month: 12, day: 1, spanDays: 25, summary: "Cozy watchlists, nostalgia remixes." },
  { id: "new-year-eve", title: "New Year’s Eve", category: "festival", month: 12, day: 31, spanDays: 3, summary: "Countdowns, lookbacks, teaser drops." },
];

function dayOfYear(d: Date): number {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0));
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

export function activeCalendarMoments(now = new Date()): CalendarMoment[] {
  const y = now.getUTCFullYear();
  const today = dayOfYear(now);
  return MOMENTS.filter((m) => {
    const target = dayOfYear(new Date(Date.UTC(y, m.month - 1, m.day)));
    const dist = Math.min(
      Math.abs(today - target),
      Math.abs(today - (target - 365)),
      Math.abs(today - (target + 365)),
    );
    return dist <= m.spanDays;
  });
}
