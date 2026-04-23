// ============================================================================
// SHOPPING CART
// ============================================================================
//
// This is the class the exercise brief's interface describes:
//
//     const cart = new ShoppingCart(pricingRules);
//     cart.add('ult_small');
//     cart.add('ult_small', 'I<3AMAYSIM');
//     cart.total;   // a number
//     cart.items;   // an array of items
//
// Key design choice: `total` and `items` are GETTERS that recompute on every
// read by running the pricing rules against the raw items. We do NOT store
// "the current total" as state. Why?
//
//   1. The same raw cart with different pricing rules would give different
//      totals — so the total isn't really a property of the cart, it's a
//      property of (cart + rules). Recomputing makes that relationship
//      explicit.
//   2. We never risk the cached total going stale after an `add()` call.
//   3. Rules can freely add free items (scenario 3) without us having to
//      remember to re-run them.
//
// The tradeoff is a tiny bit of recomputation on every read. For a cart
// with a handful of items, that's free.
// ============================================================================

const catalog = require('./catalog');

class ShoppingCart {
  /**
   * @param {Array} pricingRules  Array of rule objects, each with an
   *                              `apply({ items, promoCode, catalog,
   *                              currentDiscount })` method.
   */
  constructor(pricingRules = []) {
    this.pricingRules = pricingRules;

    // `_rawItems` stores items EXACTLY as the customer added them — no
    // discounts applied, no free items added yet. We keep them pristine so
    // re-running rules always starts from the same baseline.
    //
    // The leading underscore is a JS convention meaning "internal, don't
    // touch from outside." Not enforced by the language — just a signal.
    this._rawItems = [];
    this._promoCode = null;
  }

  /**
   * Add one product to the cart.
   *
   * @param {string} productCode  E.g. 'ult_small'. Must exist in the catalog.
   * @param {string} [promoCode]  Optional promo code. If passed on ANY call,
   *                              it becomes the cart's active promo — the
   *                              exercise brief only shows a single code, so
   *                              one slot is enough.
   */
  add(productCode, promoCode = null) {
    const product = catalog[productCode];
    if (!product) {
      // Fail loudly on typos — better than a silent "item not added."
      throw new Error(`Unknown product code: ${productCode}`);
    }

    // Spread the product into a fresh object so later mutations by rules
    // can't reach back and modify the shared catalog entry.
    this._rawItems.push({ ...product });

    if (promoCode) {
      this._promoCode = promoCode;
    }
  }

  // --------------------------------------------------------------------------
  // Private pipeline: run every rule in order, starting from the raw items,
  // and collect the final { items, discount } the customer should see.
  // --------------------------------------------------------------------------
  _applyRules() {
    // Deep-ish copy: each item is its own new object, so rules that change
    // prices (like BulkDiscountRule) don't mutate `_rawItems`.
    let items = this._rawItems.map(item => ({ ...item }));
    let discount = 0;

    for (const rule of this.pricingRules) {
      const result = rule.apply({
        items,
        promoCode: this._promoCode,
        catalog,
        currentDiscount: discount,   // needed by PercentOffPromoRule
      });
      items = result.items;
      discount += result.discount;
    }

    return { items, discount };
  }

  // --------------------------------------------------------------------------
  // Public getters — defined with `get` syntax so callers write `cart.total`
  // rather than `cart.total()`. That matches the interface in the brief.
  // --------------------------------------------------------------------------

  get items() {
    // Callers get the POST-RULE item list — including any free bundle items.
    return this._applyRules().items;
  }

  get total() {
    const { items, discount } = this._applyRules();
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);

    // Round to 2 decimals. Floating-point arithmetic can produce results
    // like 31.319999999999997; `round2` snaps them to the nearest cent.
    // For a production billing system you'd use integer cents throughout,
    // but for this exercise the simpler approach is enough.
    return round2(subtotal - discount);
  }
}

// Round a number to 2 decimal places. Multiplying by 100, rounding to an
// integer, then dividing by 100 is the classic JS idiom — it avoids the
// rounding errors you get from `.toFixed(2)` (which returns a string anyway).
function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = ShoppingCart;
