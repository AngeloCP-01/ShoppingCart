//percent off promo code
class PercentOffPromoRule {
  /**
   * @param {string} promoCode
   * @param {number} percentOff ex. 10% off
   */
  constructor(promoCode, percentOff) {
    this.promoCode = promoCode;
    this.percentOff = percentOff;
  }

  apply({ items, promoCode, currentDiscount = 0 }) {
    if (promoCode !== this.promoCode) {
      return { items, discount: 0 };
    }

    const subtotal = items.reduce((sum, item) => sum + item.price, 0);

    const discountedTotal = subtotal - currentDiscount;
    return { items, discount: discountedTotal * (this.percentOff / 100) };
  }
}

module.exports = PercentOffPromoRule;
