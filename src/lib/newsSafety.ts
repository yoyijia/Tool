/**
 * News/trend safety + postability classification.
 * Brands should not newsjack tragedies, crime, disasters, or hard politics.
 */

const NEGATIVE_NEWS =
  /\b(die|dies|died|death|dead|killed|kills?|murder|homicide|shooting|shot|stabbed|assault|rape|molest|suicide|terror(ism|ist)?|bomb(ing)?|explosion|war|invasion|missile|airstrike|hostage|abduct(ed|ion)?|kidnap|traffick(ing|ed)?|abuse|victims?|fatal|casualt|injur(ed|ies|y)|crash(es|ed)?|collision|capsiz|drown(ed|ing)?|earthquake|tsunami|typhoon|hurricane|cyclone|flood(ing|s)?|wildfire|landslide|collapse[ds]?|outbreak|epidemic|pandemic|infection surge|recall(ed|s)? (over|due)|contaminat|poison|overdose|derail|evacuat|missing (man|woman|child|person|teen)|body found|remains found|mass grave)\b/i;

const RISKY_NEWS =
  /\b(arrested|charged with|sentenced|jail(ed)?|prison|court (case|hearing)|trial|lawsuit|sue[ds]?|defamation|fraud(ster)?|scam|corruption|bribery|embezzle|money launder|investigat(ion|ed) (into|over)|probe[ds]?|suspect(ed)?|police (report|probe|arrest)|misconduct|harass(ment)?|scandal|controvers|backlash|boycott|layoffs?|retrench(ment)?|job cuts|mass firing|bankrupt(cy)?|liquidat(ion|e)|wind(ing)? up|default(ed)? on|debt crisis|impeach|coup|protest(ers)?|riot|strike action|election|by-?election|ballot|parliament (debate|vote)|senate vote|tariff war|sanction)\b/i;

export type NewsSafety = "safe" | "risky" | "negative";

/** Classify a headline/summary for brand use. */
export function classifyNewsSafety(text: string): NewsSafety {
  if (NEGATIVE_NEWS.test(text)) return "negative";
  if (RISKY_NEWS.test(text)) return "risky";
  return "safe";
}

export function isBrandSafeNews(text: string): boolean {
  return classifyNewsSafety(text) === "safe";
}

/**
 * Postable = a brand could ride this without value-signal risk:
 * entertainment, sports wins, festivals, food, lifestyle, launches, tech, culture formats.
 */
export function isPostableCulture(text: string): boolean {
  if (!isBrandSafeNews(text)) return false;
  return /\b(movie|film|premiere|cinema|trailer|netflix|series|drama|concert|tour|album|k-?pop|festival|celebration|holiday|parade|food|cafe|restaurant|hawker|recipe|menu|launch(es|ed)?|opens?|opening|debut|unveil|releases?|collab(oration)?|pop-?up|exhibition|expo|award|win(s|ner)?|champion|medal|record|milestone|anniversary|f1|match|league|tournament|game|fixture|transfer|signing|viral|meme|trend(ing)?|challenge|voucher|deal|discount|sale|weather|heatwave|travel|tourism|airline|flight deal|attraction|theme park|shopping|drop)\b/i.test(
    text,
  );
}
