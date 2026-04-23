// - A 3 for 2 deal on Unlimited 1GB Sims. So for example, if you buy 3 Unlimited 1GB Sims, you will pay the price of 2 only for the first month.
class ThreeForTwoRule {
  /**
   * @param {string} productCode  Which product gets the 3-for-2 deal  ex. 'ult_small'.
   */
  constructor(productCode) {
    this.productCode = productCode;
  }

  apply({ items }) {
    const matching = items.filter((i) => i.code === this.productCode);

    // For every group of 3, one is "free". With 5 items, freeCount = 1.
    const freeCount = Math.floor(matching.length / 3);

    if (freeCount === 0) {
      return { items, discount: 0 };
    }

    //  One free unit at this product's price, times however many free units the customer earned.
    const unitPrice = matching[0].price;
    return { items, discount: freeCount * unitPrice };
  }
}

module.exports = ThreeForTwoRule;
