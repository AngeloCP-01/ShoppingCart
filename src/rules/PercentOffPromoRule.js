// ============================================================================
// PERCENT-OFF PROMO RULE
// ============================================================================
//
// "If the customer enters promo code X, take N% off." In the brief:
// 'I<3AMAYSIM' → 10% off.
//
// This rule is the ONLY one that depends on order — it must run LAST, after
// every other rule has modified items and contributed its own discount. That
// way "10% off" applies to the net the customer would otherwise pay, not to
// the un-discounted list price. This is the less generous (and more common)
// interpretation: promos stack on top of existing deals rather than being
// applied to the original sticker price.
// ============================================================================

class PercentOffPromoRule {
  /**
   * @param {string} code     The promo code that activates the discount.
   * @param {number} percent  Percentage off (e.g. 10 for 10%).
   */
  constructor(code, percent) {
    this.code = code;
    this.percent = percent;
  }

  apply({ items, promoCode, currentDiscount = 0 }) {
    // 1. Bail out if the customer didn't enter this specific promo code.
    //    Strict equality (!==) avoids accidental matches against `null`.
    if (promoCode !== this.code) {
      return { items, discount: 0 };
    }

    // 2. Compute the current subtotal (what the items themselves cost).
    //    `.reduce` is JavaScript's way of folding an array into a single value.
    //    We start at 0 and keep adding item prices.
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);

    // 3. The net is what the customer would pay AFTER the earlier rules.
    //    `currentDiscount` is the sum of savings from rules that ran before us
    //    (passed in by the cart).
    const netAfterOtherRules = subtotal - currentDiscount;

    // 4. Return the extra discount this rule contributes: N% of the net.
    return { items, discount: netAfterOtherRules * (this.percent / 100) };
  }
}

module.exports = PercentOffPromoRule;
