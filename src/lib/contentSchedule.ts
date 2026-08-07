import type { BrandReport, ContentPlatform } from "../types";
import { observancesOnDate } from "./observances";
import { audienceLine } from "./audience";

export type ScheduleKind = "trend" | "observance" | "carousel" | "reel" | "spotlight";

export interface ScheduleSlot {
  id: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  dayLabel: string;
  weekday: string;
  /** Suggested local post time, Singapore-friendly */
  postAt: string;
  timezone: string;
  platform: ContentPlatform;
  kind: ScheduleKind;
  title: string;
  format: string;
  hook: string;
  slidesOrBeats: string[];
  whyNow: string;
  engagementTip: string;
  topicPrompt: string;
  talent?: string;
  serviceTag?: string;
}

/** Best engagement windows in SGT for B2B agency + social. */
function bestSlot(
  weekday: number,
  platform: ContentPlatform,
): { postAt: string; tip: string } {
  // 0=Sun … 6=Sat
  if (platform === "linkedin") {
    if (weekday >= 1 && weekday <= 4) {
      return {
        postAt: "09:00",
        tip: "LinkedIn peaks Tue–Thu ~8–10am SGT; reply in the first hour.",
      };
    }
    return {
      postAt: "10:00",
      tip: "Weekend LinkedIn is quieter — keep it light or skip.",
    };
  }
  if (platform === "tiktok" || platform === "youtube") {
    if (weekday === 0 || weekday === 6) {
      return {
        postAt: "19:30",
        tip: "Weekend Reels/TikTok: early evening scroll (7–9pm SGT).",
      };
    }
    return {
      postAt: "12:15",
      tip: "Weekday lunch + 7–9pm SGT are strongest for TikTok/Reels.",
    };
  }
  if (platform === "instagram") {
    if (weekday === 5) {
      return {
        postAt: "11:30",
        tip: "Friday late-morning IG carousels earn saves before the weekend.",
      };
    }
    return {
      postAt: "12:30",
      tip: "IG carousels: late morning / lunch SGT; boost with a Story sticker.",
    };
  }
  return {
    postAt: "11:00",
    tip: "Mid-morning SGT for X / secondary channels.",
  };
}

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Service-led carousel fillers when no observance/trend owns the day. */
const CAROUSEL_ROTATION: {
  title: string;
  serviceTag: string;
  slides: string[];
  hook: string;
  platform: ContentPlatform;
}[] = [
  {
    title: "5 SEO moves clinics still skip",
    serviceTag: "SEO",
    hook: "Your clinic site ranks for the wrong keywords.",
    platform: "instagram",
    slides: [
      "Hook: ranking ≠ the right patients",
      "Local intent keywords (treatment + area)",
      "Doctor/bio E-E-A-T pages",
      "Speed + mobile Core Web Vitals",
      "CTA: audit checklist save",
    ],
  },
  {
    title: "SEM vs SEO — what medical leads need now",
    serviceTag: "SEM",
    hook: "Paid search isn’t “set and forget” for clinics.",
    platform: "linkedin",
    slides: [
      "When SEM beats SEO (and vice versa)",
      "Negative keywords that save budget",
      "Landing page trust signals",
      "Lead quality > click volume",
      "CTA: book a funnel review",
    ],
  },
  {
    title: "Social pack: one idea → FB / IG / TikTok",
    serviceTag: "Social",
    hook: "Stop reinventing creative for every channel.",
    platform: "instagram",
    slides: [
      "One master concept",
      "IG carousel = depth",
      "TikTok = hook in 1s",
      "FB = proof + offer",
      "CTA: ask us for the channel matrix",
    ],
  },
  {
    title: "What is GEO? (AI search for marketers)",
    serviceTag: "AI & GEO",
    hook: "Your next patient might ask ChatGPT — not Google.",
    platform: "linkedin",
    slides: [
      "GEO in one line",
      "Cite-worthy clinic content",
      "Structured FAQs",
      "Brand mentions across the web",
      "CTA: GEO readiness score",
    ],
  },
  {
    title: "ORM: reply to reviews like a pro",
    serviceTag: "ORM",
    hook: "One bad review isn’t the problem — silence is.",
    platform: "instagram",
    slides: [
      "Respond in <24h",
      "Empathy → fact → invite offline",
      "Never argue in public",
      "Turn praise into Stories",
      "CTA: ORM playbook",
    ],
  },
  {
    title: "Website mobile check for clinics",
    serviceTag: "Website",
    hook: "If booking takes 5 taps, patients bounce.",
    platform: "linkedin",
    slides: [
      "Thumb-zone CTA",
      "Click-to-WhatsApp / call",
      "Form friction audit",
      "Trust badges above the fold",
      "CTA: free mobile teardown",
    ],
  },
  {
    title: "AM-Track®: what clients actually see",
    serviceTag: "AM-Track",
    hook: "Reporting shouldn’t need a decoder ring.",
    platform: "linkedin",
    slides: [
      "Live campaign snapshot",
      "Leads that matter",
      "Channel mix clarity",
      "Next action, not vanity metrics",
      "CTA: ask for a sample dashboard",
    ],
  },
  {
    title: "Healthcare marketing: trust first, ads second",
    serviceTag: "Healthcare",
    hook: "Clinics don’t need louder ads — they need clearer proof.",
    platform: "instagram",
    slides: [
      "Consent-first creative",
      "Myth vs fact education",
      "Team / facility proof",
      "Soft booking CTA",
      "CTA: healthcare content kit",
    ],
  },
];

function observanceSlot(
  year: number,
  month: number,
  day: number,
  report: BrandReport,
): ScheduleSlot | null {
  const items = observancesOnDate(month, day);
  if (!items.length) return null;

  const pick =
    items.find((o) =>
      /joke|youth|dog|cat|humanitarian|beach|tell a joke/i.test(o.title),
    ) ?? items[0]!;

  const d = new Date(year, month - 1, day);
  const isJoke = /joke/i.test(pick.title);
  const isYouth = /youth/i.test(pick.title);
  const isDog = /dog/i.test(pick.title);
  const platform: ContentPlatform =
    isJoke || isYouth ? "tiktok" : isDog ? "instagram" : "instagram";
  const { postAt, tip } = bestSlot(d.getDay(), platform);

  let hook = "";
  let slides: string[] = [];
  let serviceTag = "Social";
  let format = "Carousel";
  let kind: ScheduleSlot["kind"] = "observance";

  if (isDog) {
    kind = "spotlight";
    format = "Carousel + Reel cutdown";
    serviceTag = "Culture / Social";
    hook = `${report.name} culture day — loyalty, teamwork, and the clients who’d never leave.`;
    slides = [
      `Slide 1: International Dog Day · ${report.name} culture`,
      "Slide 2: What ‘loyal clients’ look like in our work",
      `Slide 3: Team / craft moment for ${audienceLine(report)}`,
      "Slide 4: Soft CTA — follow for more brand-building",
    ];
  } else if (isJoke) {
    format = "Reel / TikTok";
    serviceTag = "Social";
    hook = `A ${report.name} joke walks into a brief…`;
    slides = [
      "0–1s: text “National Tell a Joke Day”",
      `Punchline tied to ${report.name}'s craft`,
      `${report.name} logo + one serious CTA`,
    ];
  } else if (/cat/i.test(pick.title)) {
    hook = `Cat Day cameo for ${report.name} — keep it light.`;
    slides = ["One Story frame only — optional culture beat."];
    format = "Story";
    serviceTag = "Culture";
  } else if (isYouth) {
    format = "Reel";
    serviceTag = "Social / Talent";
    hook = `Youth Day: the intern who asked ChatGPT for a ${report.name} plan.`;
    slides = ["Skit beat", "Punchline", "CTA: follow / careers"];
  } else if (/beach/i.test(pick.title)) {
    hook = "Beach Day = summer wrap for campaign learnings.";
    slides = [
      "What worked in Q3 social",
      "What we’d cut",
      `One tip for ${audienceLine(report)}`,
    ];
    serviceTag = "Social";
  } else {
    hook = `${pick.title} — ${report.name} angle for ${audienceLine(report)}.`;
    slides = [
      `Hook on ${pick.title}`,
      "Bridge to a real service proof",
      "CTA to DM / site",
    ];
  }

  return {
    id: `obs-${pick.id}-${year}`,
    date: iso(year, month, day),
    dayLabel: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    weekday: d.toLocaleDateString(undefined, { weekday: "long" }),
    postAt,
    timezone: "SGT",
    platform,
    kind,
    title: isDog
      ? `International Dog Day · ${report.name} culture`
      : pick.title,
    format,
    hook,
    slidesOrBeats: slides,
    whyNow: isDog
      ? `Pet culture day remixed for ${report.name} — loyalty/team metaphor for ${audienceLine(report)}, no office-dog gimmick required.`
      : pick.summary,
    engagementTip: tip,
    serviceTag,
    topicPrompt: `Post for ${pick.title} (${iso(year, month, day)}). Brand: ${report.name}. Hook: ${hook}. Format: ${format}. Beats: ${slides.join(" · ")}`,
  };
}

/**
 * Build a posting schedule from `from` through end of that month (default: rest of August).
 * Mixes brand-angled observances with service carousels.
 */
export function buildMonthSchedule(
  report: BrandReport,
  from: Date = new Date(),
): ScheduleSlot[] {
  const year = from.getFullYear();
  const month = from.getMonth() + 1; // 1-12
  const startDay = from.getDate();
  const lastDay = new Date(year, month, 0).getDate();

  const slots: ScheduleSlot[] = [];
  let carouselIdx = 0;

  for (let day = startDay; day <= lastDay; day++) {
    const d = new Date(year, month - 1, day);
    const weekday = d.getDay();

    const obs = observanceSlot(year, month, day, report);
    // Use observance on key days; cat day = story only so we still schedule a carousel weekday
    if (obs && obs.format !== "Story") {
      slots.push(obs);
      continue;
    }

    // 3–4 posts per week: Mon/Tue/Wed/Fri (+ optional Sat Reel every other week)
    const postDay =
      weekday === 1 ||
      weekday === 2 ||
      weekday === 3 ||
      weekday === 5 ||
      (weekday === 6 && day % 14 < 7);

    if (!postDay) continue;

    const pack = CAROUSEL_ROTATION[carouselIdx % CAROUSEL_ROTATION.length]!;
    carouselIdx += 1;
    const { postAt, tip } = bestSlot(weekday, pack.platform);

    slots.push({
      id: `car-${year}-${month}-${day}-${pack.serviceTag}`,
      date: iso(year, month, day),
      dayLabel: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      weekday: d.toLocaleDateString(undefined, { weekday: "long" }),
      postAt,
      timezone: "SGT",
      platform: pack.platform,
      kind: "carousel",
      title: pack.title,
      format: pack.platform === "linkedin" ? "LinkedIn document / carousel" : "IG carousel (5 slides)",
      hook: pack.hook,
      slidesOrBeats: pack.slides,
      whyNow: `Evergreen service education for ${audienceLine(report)} — fills the calendar when no major trend owns the day.`,
      engagementTip: tip,
      serviceTag: pack.serviceTag,
      topicPrompt: `Create a ${pack.platform === "linkedin" ? "LinkedIn carousel" : "Instagram carousel"} for ${report.name}: “${pack.title}”. Hook: ${pack.hook}. Slides: ${pack.slides.join(" | ")}. Audiences: ${audienceLine(report)}. Service: ${pack.serviceTag}.`,
    });
  }

  return slots.sort((a, b) => a.date.localeCompare(b.date) || a.postAt.localeCompare(b.postAt));
}

export function scheduleSummary(slots: ScheduleSlot[]): string {
  const trends = slots.filter((s) => s.kind === "observance" || s.kind === "spotlight").length;
  const carousels = slots.filter((s) => s.kind === "carousel").length;
  const reels = slots.filter((s) => s.kind === "reel").length;
  return `${slots.length} posts · ${trends} moment/trend · ${carousels} carousels · ${reels} reel cutdowns · times in SGT`;
}
