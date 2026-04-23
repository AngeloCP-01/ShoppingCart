// ============================================================================
// SHOPPING CART — INTEGRATION TESTS
// ============================================================================
//
// We test the FOUR scenarios from the exercise brief verbatim, plus one
// sanity test for the empty-cart case. Between them, the scenarios cover all
// four pricing rules — so we don't need separate per-rule unit tests.
//
// This is "integration testing": we don't mock the rules or the catalog, we
// run the real pipeline end-to-end, exactly as a caller would.
//
// Jest gives us:
//   describe(name, fn)  — groups related tests.
//   test(name, fn)      — one test case.
//   expect(value).toBe  — compares with === (for primitives like numbers).
//   expect(value).toEqual(other) — deep-equals (for objects/arrays).
// ============================================================================

const ShoppingCart = require('../src/ShoppingCart');
const { defaultPricingRules } = require('../src/rules');

describe('ShoppingCart — scenarios from the exercise brief', () => {

  // --- Scenario 1 ----------------------------------------------------------
  // 3 × Unlimited 1GB + 1 × Unlimited 5GB → $94.70
  // Tests ThreeForTwoRule: pays for 2 × 24.90 = 49.80 on the 1GB SIMs,
  // plus 44.90 for the 5GB SIM = 94.70.
  test('Scenario 1: 3-for-2 deal on Unlimited 1GB', () => {
    const cart = new ShoppingCart(defaultPricingRules);
    cart.add('ult_small');
    cart.add('ult_small');
    cart.add('ult_small');
    cart.add('ult_large');

    expect(cart.total).toBe(94.70);
    expect(itemCodes(cart)).toEqual(['ult_large', 'ult_small', 'ult_small', 'ult_small']);
  });

  // --- Scenario 2 ----------------------------------------------------------
  // 2 × Unlimited 1GB + 4 × Unlimited 5GB → $209.40
  // Tests BulkDiscountRule: 4 × 39.90 = 159.60 on the 5GB SIMs (bulk price
  // kicks in at 4), plus 2 × 24.90 = 49.80 (no 3-for-2 with only 2) = 209.40.
  test('Scenario 2: bulk discount on Unlimited 5GB at 4+ units', () => {
    const cart = new ShoppingCart(defaultPricingRules);
    cart.add('ult_small');
    cart.add('ult_small');
    cart.add('ult_large');
    cart.add('ult_large');
    cart.add('ult_large');
    cart.add('ult_large');

    expect(cart.total).toBe(209.40);
    expect(cart.items).toHaveLength(6);
  });

  // --- Scenario 3 ----------------------------------------------------------
  // 1 × Unlimited 1GB + 2 × Unlimited 2GB → $84.70
  // Items returned should INCLUDE 2 × 1GB data-pack (bundled free).
  // Tests FreeBundleRule: 24.90 + 2 × 29.90 = 84.70 (the free data-packs
  // contribute $0 to the total but still appear in cart.items).
  test('Scenario 3: free 1GB data-pack bundled with each Unlimited 2GB', () => {
    const cart = new ShoppingCart(defaultPricingRules);
    cart.add('ult_small');
    cart.add('ult_medium');
    cart.add('ult_medium');

    expect(cart.total).toBe(84.70);
    expect(itemCodes(cart)).toEqual(
      ['1gb', '1gb', 'ult_medium', 'ult_medium', 'ult_small']
    );
  });

  // --- Scenario 4 ----------------------------------------------------------
  // 1 × Unlimited 1GB + 1 × 1GB Data-pack + 'I<3AMAYSIM' → $31.32
  // Tests PercentOffPromoRule: (24.90 + 9.90) × 0.9 = 31.32 exactly.
  test('Scenario 4: I<3AMAYSIM promo takes 10% off', () => {
    const cart = new ShoppingCart(defaultPricingRules);
    cart.add('ult_small');
    cart.add('1gb', 'I<3AMAYSIM');

    expect(cart.total).toBe(31.32);
    expect(itemCodes(cart)).toEqual(['1gb', 'ult_small']);
  });

  // --- Edge case -----------------------------------------------------------
  // Not in the brief, but worth one test: an empty cart shouldn't crash and
  // should total to zero. This catches bugs where a rule blindly reads
  // `items[0]` or divides by item count.
  test('Empty cart returns total of $0 and no items', () => {
    const cart = new ShoppingCart(defaultPricingRules);

    expect(cart.total).toBe(0);
    expect(cart.items).toEqual([]);
  });
});

// ----------------------------------------------------------------------------
// Tiny helper: extract item codes from a cart and sort them, so assertions
// don't depend on the order items were added/pushed. Sorting is what makes
// `toEqual` pass regardless of where a rule inserted the free bundle items.
// ----------------------------------------------------------------------------
function itemCodes(cart) {
  return cart.items.map(i => i.code).sort();
}
