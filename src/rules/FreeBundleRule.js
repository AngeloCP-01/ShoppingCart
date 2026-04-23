// ============================================================================
// FREE BUNDLE RULE
// ============================================================================
//
// "For every X the customer buys, throw in a free Y." In the brief: every
// Unlimited 2GB SIM comes with a free 1GB data-pack.
//
// This rule ADDS items to the cart (at price 0) rather than applying a
// discount. That's important because the brief's scenario 3 expects the free
// data-packs to appear in `cart.items` — the customer should see what they're
// getting, not just a lower total.
// ============================================================================

class FreeBundleRule {
  /**
   * @param {string} triggerCode  The product that triggers the freebie
   *                              (e.g. 'ult_medium').
   * @param {string} freeCode     The product to add for free
   *                              (e.g. '1gb').
   */
  constructor(triggerCode, freeCode) {
    this.triggerCode = triggerCode;
    this.freeCode = freeCode;
  }

  apply({ items, catalog }) {
    // 1. How many trigger products are in the cart? That's how many freebies
    //    the customer has earned.
    const triggerCount = items.filter(i => i.code === this.triggerCode).length;

    if (triggerCount === 0) {
      return { items, discount: 0 };
    }

    // 2. Look up the free product in the catalog so we know its name, etc.
    const freeProduct = catalog[this.freeCode];

    // 3. Build a NEW array rather than mutating the input. We push one free
    //    item per trigger, with price forced to 0 (it's free, after all).
    const newItems = [...items];
    for (let i = 0; i < triggerCount; i++) {
      newItems.push({ ...freeProduct, price: 0 });
    }

    // No discount field needed — the free items contribute 0 to the subtotal.
    return { items: newItems, discount: 0 };
  }
}

module.exports = FreeBundleRule;
