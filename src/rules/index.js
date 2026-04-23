// RULES BARREL + DEFAULT RULE SET
const ThreeForTwoRule = require("./ThreeForTwoRule");
const BulkDiscountRule = require("./BulkDiscountRule");
const FreeBundleRule = require("./FreeBundleRule");
const PercentOffPromoRule = require("./PercentOffPromoRule");

// The promo must be last so it applies to the net after other rules.
const defaultPricingRules = [
  new ThreeForTwoRule("ult_small"), // 3 for 2 on Unlimited 1GB
  new BulkDiscountRule("ult_large", 4, 39.9), // 4+ Unlimited 5GB → $39.90 each
  new FreeBundleRule("ult_medium", "1gb"), // free 1GB data-pack with each Unlimited 2GB
  new PercentOffPromoRule("I<3AMAYSIM", 10), // 10% off with promo code
];

module.exports = {
  ThreeForTwoRule,
  BulkDiscountRule,
  FreeBundleRule,
  PercentOffPromoRule,
  defaultPricingRules,
};
