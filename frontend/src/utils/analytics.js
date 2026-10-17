// Anonymous Session ID generator & storage
export const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem('bixa_pf_session_id');
  if (!sessionId) {
    sessionId = 'pf_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem('bixa_pf_session_id', sessionId);
  }
  return sessionId;
};

export const trackProductFinderEvent = async (eventName, metadata = {}) => {
  try {
    const sessionId = getOrCreateSessionId();
    const payload = {
      event: eventName,
      sessionId,
      metadata,
      timestamp: new Date().toISOString()
    };

    console.log(`[BIXA Analytics] Event: ${eventName}`, payload);

    const apiBase = window.__BIXA_API_BASE__ || '/api/product-finder';
    await fetch(`${apiBase}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.warn('Analytics event dispatch warning:', err));
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};
