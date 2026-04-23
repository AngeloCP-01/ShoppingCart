// ============================================================================
// RULES BARREL + DEFAULT RULE SET
// ============================================================================
//
// A "barrel" file re-exports a bunch of related modules from one spot, so
// callers can write a single `require('./rules')` instead of four separate
// ones. Node/JS convention names this file `index.js`.
//
// We also provide `defaultPricingRules` — the specific configuration from
// the exercise brief. Callers who just want the standard Amaysim promos can
// grab this; callers who want a custom set can build their own array of rule
// instances and pass it to `new ShoppingCart(...)`.
//
// This is why rules being DATA matters: flipping a promotion on or off is a
// one-line edit, not a code change.
// ============================================================================

const ThreeForTwoRule = require('./ThreeForTwoRule');
const BulkDiscountRule = require('./BulkDiscountRule');
const FreeBundleRule = require('./FreeBundleRule');
const PercentOffPromoRule = require('./PercentOffPromoRule');

// The promo must be last so it applies to the net after other rules.
// The order of the first three doesn't matter (they touch different products).
const defaultPricingRules = [
  new ThreeForTwoRule('ult_small'),                 // 3 for 2 on Unlimited 1GB
  new BulkDiscountRule('ult_large', 4, 39.90),      // 4+ Unlimited 5GB → $39.90 each
  new FreeBundleRule('ult_medium', '1gb'),          // free 1GB data-pack with each Unlimited 2GB
  new PercentOffPromoRule('I<3AMAYSIM', 10),        // 10% off with promo code
];

module.exports = {
  ThreeForTwoRule,
  BulkDiscountRule,
  FreeBundleRule,
  PercentOffPromoRule,
  defaultPricingRules,
};
