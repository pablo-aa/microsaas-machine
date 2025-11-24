const COOKIE_PREFIX = '_ga';
const MEASUREMENT_ID = 'G-77JYHQR2GR';
const MEASUREMENT_COOKIE_NAME = `_ga_${MEASUREMENT_ID.replace('G-', '')}`;

const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1] ?? null;
};

export const getGaClientId = (): string | null => {
  const value = getCookieValue(COOKIE_PREFIX);
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length >= 4) {
    return `${parts[2]}.${parts[3]}`;
  }
  return null;
};

const parseGs1SessionCookie = (value: string) => {
  const parts = value.split('.');
  if (parts.length >= 6) {
    const sessionNumber = parts[3];
    const sessionId = parts[4];
    return { sessionNumber, sessionId };
  }
  return null;
};

const parseGs2SessionCookie = (value: string) => {
  const segments = value.split('.');
  if (segments.length < 5) return null;
  const keyValueSegment = segments[4];
  const pairs = keyValueSegment.split('*');
  let sessionId: string | undefined;
  let sessionNumber: string | undefined;
  for (const pair of pairs) {
    if (pair.includes('~')) {
      const [key, val] = pair.split('~');
      if (!key || !val) continue;
      if (key === 'sid' || key.startsWith('s')) {
        sessionId = val;
      }
      if (key === 'sct' || key === 'o') {
        sessionNumber = val;
      }
    } else if (pair.length > 1) {
      const key = pair[0];
      const rest = pair.substring(1);
      if (key === 's' && rest) sessionId = rest;
      if ((key === 'o' || key === 't') && rest) sessionNumber = rest;
    }
  }
  if (sessionId && sessionNumber) return { sessionId, sessionNumber };
  return null;
};

export const getGaSessionData = (): { sessionId: string; sessionNumber: string } | null => {
  const cookieName = MEASUREMENT_COOKIE_NAME;
  let value = getCookieValue(cookieName);
  if (!value) return null;
  if (value.startsWith('GS1.')) {
    return parseGs1SessionCookie(value);
  }
  if (value.startsWith('GS2.')) {
    return parseGs2SessionCookie(value);
  }
  // Fallback: try to find any _ga_ cookie (legacy)
  if (cookieName !== MEASUREMENT_COOKIE_NAME) {
    const fallbackValue = getCookieValue(cookieName);
    if (fallbackValue?.startsWith('GS1.')) return parseGs1SessionCookie(fallbackValue);
    if (fallbackValue?.startsWith('GS2.')) return parseGs2SessionCookie(fallbackValue);
  }
  return null;
};

export const getGaIdentifiers = () => {
  const clientId = getGaClientId();
  const sessionData = getGaSessionData();

  return {
    ga_client_id: clientId ?? null,
    ga_session_id: sessionData?.sessionId ?? null,
    ga_session_number: sessionData?.sessionNumber ?? null,
  };
};

