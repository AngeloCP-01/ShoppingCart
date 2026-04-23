// ============================================================================
// THREE-FOR-TWO RULE
// ============================================================================
//
// "If you buy 3 of product X, you only pay for 2." For 6, you pay for 4. Etc.
//
// We implement this as a DISCOUNT rather than by removing items from the cart,
// because the customer still receives 3 SIMs — they just pay for 2.
// ============================================================================

class ThreeForTwoRule {
  /**
   * @param {string} productCode  Which product gets the 3-for-2 deal
   *                              (e.g. 'ult_small').
   */
  constructor(productCode) {
    this.productCode = productCode;
  }

  // Every rule exposes the same `apply(context)` method. This uniform shape
  // is what lets the cart loop over rules without caring what each one does —
  // that's the whole point of the Strategy pattern.
  apply({ items }) {
    // 1. Find every cart item that matches this rule's product.
    const matching = items.filter(i => i.code === this.productCode);

    // 2. For every group of 3, one is "free". With 5 items, freeCount = 1.
    //    Math.floor ensures we don't give a fractional free item for 4 items.
    const freeCount = Math.floor(matching.length / 3);

    // 3. If there's nothing to discount, return the cart unchanged. Returning
    //    a discount of 0 is the no-op for this rule.
    if (freeCount === 0) {
      return { items, discount: 0 };
    }

    // 4. One free unit at this product's price, times however many free units
    //    the customer earned.
    const unitPrice = matching[0].price;
    return { items, discount: freeCount * unitPrice };
  }
}

module.exports = ThreeForTwoRule;
