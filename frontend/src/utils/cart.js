// Talks to the store's Shopify cart through its standard AJAX endpoints. These are same-origin, so
// they only work when the widget is running on the store (including theme previews).

// The store's AOV cart-drawer app wraps fetch and opens its drawer after any cart request, unless the
// URL carries its own marker. Adding quietly lets customers keep collecting products in the widget.
const QUIET_ADD_URL = '/cart/add.js?app=aov-cart-drawer';

// Keeps the theme's header cart badge in step, since the theme only updates it on its own adds.
const updateHeaderCartBadge = (count) => {
  document.querySelectorAll('.js-cart-count').forEach((el) => {
    el.textContent = String(count);
  });
};

export const getCartCount = async () => {
  const res = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Cart request failed: ${res.status}`);
  const cart = await res.json();
  return cart.item_count;
};

// Adds one unit and resolves with the cart's new item count. Rejects if Shopify refuses the add
// (e.g. the product is sold out).
export const addToCart = async (variantId) => {
  const res = await fetch(QUIET_ADD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] })
  });
  if (!res.ok) throw new Error(`Add to cart failed: ${res.status}`);

  const count = await getCartCount();
  updateHeaderCartBadge(count);
  window.aovCartDrawerUpdate?.(); // refreshes the drawer's contents without opening it
  return count;
};

// Opens the store's cart drawer. Returns false when the app isn't available, so the caller can fall
// back to the cart page.
export const openCartDrawer = () => {
  if (typeof window.aovCartDrawerOpen !== 'function') return false;
  window.aovCartDrawerOpen();
  return true;
};
