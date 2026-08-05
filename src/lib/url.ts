/** Normalize user input into a fetchable URL. */
export function toUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter a website name or URL.");

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Bare domain or name → assume https
  const cleaned = trimmed
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");

  if (cleaned.includes(" ") || !cleaned.includes(".")) {
    // Brand name like "nike" → nike.com
    const slug = cleaned.toLowerCase().replace(/[^a-z0-9]+/g, "");
    return `https://www.${slug}.com`;
  }

  return `https://${cleaned}`;
}

export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function brandNameFromDomain(domain: string): string {
  const base = domain.split(".")[0] ?? domain;
  return base.charAt(0).toUpperCase() + base.slice(1);
}
