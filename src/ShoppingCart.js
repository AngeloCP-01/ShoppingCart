const catalog = require("./catalog");

class ShoppingCart {
  /**
   * @param {Array} pricingRules  Array of rule objects
   */
  constructor(pricingRules = []) {
    this.pricingRules = pricingRules;

    this._rawItems = []; // raw items, now discount or rules applied
    this._promoCode = null;
  }

  /**
   * Add one product to the cart.
   *
   * @param {string} productCode  ex. 'ult_small'.
   * @param {string} [promoCode]  Optional promo code
   */
  add(productCode, promoCode = null) {
    const product = catalog[productCode];
    if (!product) {
      throw new Error(`Unknown product code: ${productCode}`);
    }

    this._rawItems.push({ ...product });

    if (promoCode) {
      this._promoCode = promoCode;
    }
  }

  _applyRules() {
    let items = this._rawItems.map((item) => ({ ...item }));
    let discount = 0;

    for (const rule of this.pricingRules) {
      const result = rule.apply({
        items,
        promoCode: this._promoCode,
        catalog,
        currentDiscount: discount, // needed by PercentOffPromoRule
      });
      items = result.items;
      discount += result.discount;
    }

    return { items, discount };
  }

  get items() {
    // Callers get the POST-RULE item list — including any free bundle items.
    return this._applyRules().items;
  }

  get total() {
    const { items, discount } = this._applyRules();
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const total = subtotal - discount;
    return Math.round(total * 100) / 100;
  }
}

module.exports = ShoppingCart;
