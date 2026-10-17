import express from 'express';
import {
  getCategories,
  getProducts,
  getConcerns,
  getConcernBySlug,
  logAnalyticsEvent
} from '../services/firestoreService.js';

const router = express.Router();

// GET /product-finder/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve product categories' });
  }
});

// GET /product-finder/products
router.get('/products', async (req, res) => {
  try {
    const { category, format, letter, q, limit } = req.query;
    const products = await getProducts({
      category,
      format,
      letter,
      query: q,
      limit: limit ? parseInt(limit, 10) : 100
    });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve products' });
  }
});

// GET /product-finder/search
router.get('/search', async (req, res) => {
  try {
    const { q, category } = req.query;
    if (!q || q.trim() === '') {
      return res.status(400).json({ success: false, error: 'Search query "q" parameter is required' });
    }
    const results = await getProducts({ category, query: q });
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

// GET /product-finder/concerns
router.get('/concerns', async (req, res) => {
  try {
    const { q } = req.query;
    const concerns = await getConcerns({ query: q });
    res.json({ success: true, count: concerns.length, data: concerns });
  } catch (error) {
    console.error('Error fetching concerns:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve health concerns' });
  }
});

// GET /product-finder/concerns/:slug
router.get('/concerns/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const concernDetails = await getConcernBySlug(slug);

    if (!concernDetails) {
      return res.status(404).json({ success: false, error: `Concern with slug "${slug}" not found` });
    }

    res.json({ success: true, data: concernDetails });
  } catch (error) {
    console.error(`Error fetching concern detail for ${req.params.slug}:`, error);
    res.status(500).json({ success: false, error: 'Failed to retrieve concern details' });
  }
});

// POST /product-finder/events
router.post('/events', async (req, res) => {
  try {
    const { event, eventType, metadata, sessionId } = req.body;
    if (!event && !eventType) {
      return res.status(400).json({ success: false, error: 'Event type is required' });
    }

    const result = await logAnalyticsEvent({
      sessionId: sessionId || 'pf_anon_session',
      eventType: event || eventType,
      metadata: metadata || {}
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error logging analytics event:', error);
    res.status(500).json({ success: false, error: 'Failed to record event' });
  }
});

export default router;
