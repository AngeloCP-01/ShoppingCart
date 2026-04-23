//FreeBundleRule - if the customer buys a certain product with freebie
class FreeBundleRule {
  /**
   * @param {string} triggerCode  The product that triggers the freebie
   * @param {string} freeCode     The product to add for free
   */
  constructor(triggerCode, freeCode) {
    this.triggerCode = triggerCode;
    this.freeCode = freeCode;
  }

  apply({ items, catalog }) {
    //cheecks and count how many times the trigger product is in the cart
    const triggerCount = items.filter(
      (i) => i.code === this.triggerCode,
    ).length;

    //checks if there are trigger products in the cart
    if (triggerCount === 0) {
      return { items, discount: 0 };
    }

    const freeProduct = catalog[this.freeCode]; //look for the free product

    const newItems = [...items]; //create a new array with the same items
    for (let i = 0; i < triggerCount; i++) {
      newItems.push({ ...freeProduct, price: 0 }); //add the free product to the new array
    }

    return { items: newItems, discount: 0 };
  }
}

module.exports = FreeBundleRule;
