// ============================================================================
// BULK DISCOUNT RULE
// ============================================================================
//
// "If the customer buys N or more of product X, each unit's price drops to Y."
// In the brief, this is: 4+ Unlimited 5GB SIMs drop from $44.90 to $39.90 each.
//
// Notice we change the ITEM PRICE itself, rather than returning a discount.
// Why? Because the customer's receipt should show the actual per-unit price
// they paid — that's more transparent than "4 × $44.90 minus a mystery $20
// discount."
// ============================================================================

class BulkDiscountRule {
  /**
   * @param {string} productCode  Which product is eligible (e.g. 'ult_large').
   * @param {number} minQty       Minimum quantity that triggers the discount
   *                              (e.g. 4 — meaning "buy 4 or more").
   * @param {number} newPrice     The per-unit price once the rule triggers.
   */
  constructor(productCode, minQty, newPrice) {
    this.productCode = productCode;
    this.minQty = minQty;
    this.newPrice = newPrice;
  }

  apply({ items }) {
    // 1. How many of this product are in the cart?
    const count = items.filter(i => i.code === this.productCode).length;

    // 2. Not enough to trigger the rule → cart unchanged.
    if (count < this.minQty) {
      return { items, discount: 0 };
    }

    // 3. Rewrite the price on every matching item. `.map` returns a NEW array
    //    and we spread the item (`...item`) so we don't mutate the original —
    //    mutation would silently affect later rules or callers. Treat data
    //    you receive as read-only; build new data if you need changes.
    const modifiedItems = items.map(item =>
      item.code === this.productCode
        ? { ...item, price: this.newPrice }
        : item
    );

    // 4. No separate discount — we expressed the saving by lowering prices.
    return { items: modifiedItems, discount: 0 };
  }
}

module.exports = BulkDiscountRule;
