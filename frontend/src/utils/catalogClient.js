import catalog from '../data/catalog.json';

// The widget's data source. Instead of calling a hosted API, it answers the same requests from
// `src/data/catalog.json`, which `npm run build` regenerates from the knowledge base via
// backend/scripts/export-static-data.js — so the live site needs no server. Responses keep the API's
// `{ success, data }` shape so the screens didn't have to change.

const expand = (ids = []) => ids.map(id => catalog.products[id]).filter(Boolean);

const respond = (data) => Promise.resolve({ success: true, count: Array.isArray(data) ? data.length : undefined, data });
const notFound = (message) => Promise.resolve({ success: false, error: message });

// `path` mirrors the old API routes, e.g. "/concerns?q=hair" or "/concerns/hair-wellness".
export const catalogRequest = (path) => {
  const [route, queryString = ''] = path.split('?');
  const query = new URLSearchParams(queryString);

  if (route === '/concerns') {
    const q = (query.get('q') || '').trim().toLowerCase();
    return respond(q ? catalog.concerns.filter(c => c.name.toLowerCase().includes(q)) : catalog.concerns);
  }

  const concernMatch = route.match(/^\/concerns\/([^/]+)$/);
  if (concernMatch) {
    const detail = catalog.concernDetails[decodeURIComponent(concernMatch[1])];
    if (!detail) return notFound('Concern not found');
    return respond({
      ...detail,
      products: expand(detail.products),
      sections: detail.sections.map(s => ({ ...s, products: expand(s.products) }))
    });
  }

  return notFound(`Unknown catalog route: ${route}`);
};

export default catalogRequest;
