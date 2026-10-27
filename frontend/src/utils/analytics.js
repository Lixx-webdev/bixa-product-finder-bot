// Widget analytics. Events go to the host store's own Google Analytics 4 (bixabotanical.in already
// loads gtag and Google Tag Manager), so there's no analytics server to run. Event names are
// prefixed `pf_` (e.g. `pf_concern_selected`) so they're easy to filter in GA4.
//
// Optional: if `window.__BIXA_API_BASE__` is set (e.g. the backend in backend/ is deployed), events
// are also POSTed to `${__BIXA_API_BASE__}/events`, as before.

const EVENT_PREFIX = 'pf_';

// GA4 limits: event/param names ≤ 40 chars, string param values ≤ 100 chars, flat values only.
const toGaParams = (metadata) => {
  const params = {};
  Object.entries(metadata || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const name = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`).slice(0, 40);
    params[name] = typeof value === 'number' || typeof value === 'boolean' ? value : String(value).slice(0, 100);
  });
  return params;
};

export const trackProductFinderEvent = (eventName, metadata = {}) => {
  try {
    const gaEventName = `${EVENT_PREFIX}${eventName}`.slice(0, 40);
    const params = toGaParams(metadata);

    if (typeof window.gtag === 'function') {
      window.gtag('event', gaEventName, params);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: gaEventName, ...params });
    }

    if (window.__BIXA_API_BASE__) {
      fetch(`${window.__BIXA_API_BASE__}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, metadata, timestamp: new Date().toISOString() })
      }).catch(() => {});
    }
  } catch (error) {
    // Tracking must never break the widget.
  }
};
