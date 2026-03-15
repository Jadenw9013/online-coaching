interface ZippopotamPlace {
  "place name": string;
  "state abbreviation": string;
  state: string;
}

interface ZippopotamResponse {
  "post code": string;
  country: string;
  places: ZippopotamPlace[];
}

export interface ZipLocation {
  city: string;
  state: string;       // abbreviated, e.g. "WA"
  stateName: string;   // full, e.g. "Washington"
  zip: string;
}

/**
 * Resolves a US zip code to city/state using the free zippopotam.us API.
 * Returns null for unknown or invalid zip codes.
 */
export async function resolveZipCode(zip: string): Promise<ZipLocation | null> {
  const clean = zip.trim().replace(/\D/g, "").slice(0, 5);
  if (clean.length !== 5) return null;

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${clean}`, {
      next: { revalidate: 86400 }, // cache for 24h — zip → city never changes
    });
    if (!res.ok) return null;

    const data: ZippopotamResponse = await res.json();
    const place = data.places?.[0];
    if (!place) return null;

    return {
      city: place["place name"],
      state: place["state abbreviation"],
      stateName: place.state,
      zip: clean,
    };
  } catch {
    return null;
  }
}
