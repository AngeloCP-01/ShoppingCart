// ============================================================================
// DEMO — runs the four exercise scenarios and prints them to the console
// ============================================================================
//
// This file isn't required by the exercise, but it lets a human eyeball that
// the cart actually works without needing to read test output. Run it with:
//
//     node demo.js
//
// The tests in `tests/ShoppingCart.test.js` are the source of truth for
// correctness — this demo is just for human-friendly inspection.
// ============================================================================

const ShoppingCart = require("./src/ShoppingCart");
const { defaultPricingRules } = require("./src/rules");

// Run one scenario: a short description, a function that adds items, and
// the expected total (so we can visually confirm we hit it).
function runScenario(name, addItems, expectedTotal) {
  const cart = new ShoppingCart(defaultPricingRules);
  addItems(cart);

  console.log(`\n=== ${name} ===`);
  console.log(`Cart items (${cart.items.length}):`);
  for (const item of cart.items) {
    console.log(`  - ${item.name.padEnd(18)} $${item.price.toFixed(2)}`);
  }
  const match = cart.total === expectedTotal ? "OK" : "MISMATCH";
  console.log(
    `Total: $${cart.total.toFixed(2)}   (expected $${expectedTotal.toFixed(2)} — ${match})`,
  );
}

runScenario(
  "Testing Product 1",
  (cart) => {
    cart.add("test_product");
  },
  4.9,
);

runScenario(
  "Scenario 1 — 3 × ult_small, 1 × ult_large",
  (cart) => {
    cart.add("ult_small");
    cart.add("ult_small");
    cart.add("ult_small");
    cart.add("ult_large");
  },
  94.7,
);

runScenario(
  "Scenario 2 — 2 × ult_small, 4 × ult_large",
  (cart) => {
    cart.add("ult_small");
    cart.add("ult_small");
    cart.add("ult_large");
    cart.add("ult_large");
    cart.add("ult_large");
    cart.add("ult_large");
  },
  209.4,
);

runScenario(
  "Scenario 3 — 1 × ult_small, 2 × ult_medium",
  (cart) => {
    cart.add("ult_small");
    cart.add("ult_medium");
    cart.add("ult_medium");
  },
  84.7,
);

runScenario(
  "Scenario 4 — 1 × ult_small, 1 × 1gb + I<3AMAYSIM promo",
  (cart) => {
    cart.add("ult_small");
    cart.add("1gb", "I<3AMAYSIM");
  },
  31.32,
);
