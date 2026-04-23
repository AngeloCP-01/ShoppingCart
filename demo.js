// node demo.js to execute
const ShoppingCart = require("./src/ShoppingCart");
const { defaultPricingRules } = require("./src/rules");

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
