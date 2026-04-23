//BulkDiscountRule - if the customer buys N or more of a product, the price of each unit drops to Y

class BulkDiscountRule {
  /**
   * @param {string} productCode
   * @param {number} minQty // minimum quanty before bulk discount applies
   * @param {number} discountedPrice
   */
  constructor(productCode, minQty, discountedPrice) {
    this.productCode = productCode;
    this.minQty = minQty;
    this.discountedPrice = discountedPrice;
  }

  apply({ items }) {
    const count = items.filter((i) => i.code === this.productCode).length;

    if (count < this.minQty) {
      return { items, discount: 0 };
    }

    const modifiedItems = items.map((item) =>
      item.code === this.productCode
        ? { ...item, price: this.discountedPrice }
        : item,
    );

    return { items: modifiedItems, discount: 0 };
  }
}

module.exports = BulkDiscountRule;
