const VISITOR_ID_STORAGE_KEY = "qc_visitor_id";

type IdentifyAttributes = Record<string, unknown>;

export type IdentifyResult = {
  id: string;
  attributes: IdentifyAttributes;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function getStoredVisitorId(): string | null {
  if (!isBrowser()) return null;

  try {
    const stored =
      window.localStorage.getItem(VISITOR_ID_STORAGE_KEY) ??
      (typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((c) => c.startsWith(`${VISITOR_ID_STORAGE_KEY}=`))
            ?.split("=")[1] ?? null
        : null);

    return stored || null;
  } catch {
    return null;
  }
}

function persistVisitorId(id: string) {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, id);
  } catch {
    // ignore storage errors
  }

  try {
    document.cookie = `${VISITOR_ID_STORAGE_KEY}=${id};path=/;max-age=${
      60 * 60 * 24 * 365
    }`;
  } catch {
    // ignore cookie errors
  }
}

function createVisitorId(): string | null {
  if (!isBrowser()) return null;

  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // fall back below
  }

  try {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 10)
    ).toUpperCase();
  } catch {
    return null;
  }
}

export function getVisitorId(): string | null {
  const existing = getStoredVisitorId();
  if (existing) return existing;

  const created = createVisitorId();
  if (!created) return null;

  persistVisitorId(created);
  return created;
}

export function identify(): IdentifyResult | undefined {
  const id = getVisitorId();
  if (!id) return undefined;

  return {
    id,
    attributes: {},
  };
}


