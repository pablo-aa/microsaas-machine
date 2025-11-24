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
  if (segments.length < 3) return null;
  
  let sessionId: string | undefined;
  let sessionNumber: string | undefined;
  
  // Strategy 1: Format GS2.1.s<session_id>$o<session_number>$... (most common real format)
  // Example: GS2.1.s1764022943$o1$g1$t1764022943$j60$l0$h1265486274
  if (segments.length >= 3 && segments[2]) {
    const dataSegment = segments[2];
    const pairs = dataSegment.split('$');
    
    for (const pair of pairs) {
      if (pair.length < 2) continue;
      const key = pair[0];
      const rest = pair.substring(1);
      
      // session_id: starts with 's' followed by digits
      if (key === 's' && /^\d+/.test(rest)) {
        // Extract just the numeric part (may have more chars after)
        const match = rest.match(/^(\d+)/);
        if (match) sessionId = match[1];
      }
      // session_number: starts with 'o' followed by digits
      if (key === 'o' && /^\d+/.test(rest)) {
        const match = rest.match(/^(\d+)/);
        if (match) sessionNumber = match[1];
      }
    }
    
    if (sessionId && sessionNumber) {
      return { sessionId, sessionNumber };
    }
  }
  
  // Strategy 2: Format with segment 4, using * separator and ~ for key-value pairs
  // Example: GS2.1.<timestamp>.<other>.sid~<session_id>*sct~<session_number>*...
  if (segments.length >= 5 && segments[4]) {
    const keyValueSegment = segments[4];
    const pairs = keyValueSegment.split('*');
    
    for (const pair of pairs) {
      if (pair.includes('~')) {
        const [key, val] = pair.split('~');
        if (!key || !val) continue;
        if (key === 'sid' || (key.startsWith('s') && key.length > 1)) {
          sessionId = val;
        }
        if (key === 'sct' || key === 'o') {
          sessionNumber = val;
        }
      } else if (pair.length > 1) {
        const key = pair[0];
        const rest = pair.substring(1);
        if (key === 's' && rest && !sessionId) sessionId = rest;
        if ((key === 'o' || key === 't') && rest && !sessionNumber) sessionNumber = rest;
      }
    }
    
    if (sessionId && sessionNumber) {
      return { sessionId, sessionNumber };
    }
  }
  
  // Strategy 3: Try to find s<digits> and o<digits> anywhere in the cookie value
  // More permissive fallback
  const allSegments = segments.slice(2).join('.');
  const sessionIdMatch = allSegments.match(/[^a-z]s(\d+)/i);
  const sessionNumberMatch = allSegments.match(/[^a-z]o(\d+)/i);
  
  if (sessionIdMatch && sessionNumberMatch) {
    return {
      sessionId: sessionIdMatch[1],
      sessionNumber: sessionNumberMatch[1]
    };
  }
  
  return null;
};

export const getGaSessionData = (): { sessionId: string; sessionNumber: string } | null => {
  // Try the specific measurement ID cookie first
  const cookieName = MEASUREMENT_COOKIE_NAME;
  let value = getCookieValue(cookieName);
  
  if (value) {
    if (value.startsWith('GS1.')) {
      const result = parseGs1SessionCookie(value);
      if (result) return result;
    }
    if (value.startsWith('GS2.')) {
      const result = parseGs2SessionCookie(value);
      if (result) return result;
    }
    // Try parsing as GS2 even if it doesn't start with GS2. (some edge cases)
    const result = parseGs2SessionCookie(value);
    if (result) return result;
  }
  
  // Fallback: try to find any _ga_ cookie (for legacy or different measurement IDs)
  if (typeof document !== 'undefined') {
    const allCookies = document.cookie.split('; ');
    for (const cookie of allCookies) {
      if (cookie.startsWith('_ga_') && !cookie.startsWith(cookieName)) {
        const cookieParts = cookie.split('=');
        if (cookieParts.length >= 2) {
          const cookieValue = cookieParts.slice(1).join('=');
          if (cookieValue.startsWith('GS1.')) {
            const result = parseGs1SessionCookie(cookieValue);
            if (result) return result;
          }
          if (cookieValue.startsWith('GS2.')) {
            const result = parseGs2SessionCookie(cookieValue);
            if (result) return result;
          }
        }
      }
    }
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

