# Amaysim Shopping Cart

Implementation of the Amaysim shopping cart exercise. Plain Node.js, Jest for tests, no other dependencies.

See `README (1).md` for the original exercise brief and `docs/design.md` for the design rationale.

## Requirements
- Node.js 16 or newer

## Install
```bash
npm install
```
This installs Jest (the only dependency, and only for testing).

## Run the tests
```bash
npm test
```
Runs all 5 tests: the 4 scenarios from the brief plus an empty-cart sanity check.

## Run the demo
```bash
npm run demo
```
Prints the 4 scenarios with their items and totals, so you can eyeball the cart at work.

## How to use the cart
```js
const ShoppingCart = require('./src/ShoppingCart');
const { defaultPricingRules } = require('./src/rules');

const cart = new ShoppingCart(defaultPricingRules);
cart.add('ult_small');
cart.add('ult_small');
cart.add('ult_small');
cart.add('ult_large');

cart.total;  // 94.70
cart.items;  // [{ code: 'ult_small', ... }, ...]
```

Pass a promo code on any `add()` call:
```js
cart.add('1gb', 'I<3AMAYSIM');
```

## File layout
```
src/
  ShoppingCart.js          The cart class
  catalog.js               Product data
  rules/
    ThreeForTwoRule.js     3-for-2 on Unlimited 1GB
    BulkDiscountRule.js    $39.90 each on 4+ Unlimited 5GB
    FreeBundleRule.js      Free 1GB data-pack with each Unlimited 2GB
    PercentOffPromoRule.js 10% off with I<3AMAYSIM
    index.js               Barrel export + default rule set
tests/
  ShoppingCart.test.js     Integration tests (the 4 scenarios + empty cart)
demo.js                    Human-friendly scenario runner
docs/design.md             Design decisions and reasoning
```

## Design summary
Pricing rules are modelled as **strategy objects** — each rule is its own class with a uniform `apply(context)` method. The cart just iterates over an array of rule objects. This keeps the cart ignorant of any specific promotion, so adding a new promo is a matter of writing a new ~15-line class and dropping an instance of it into the rules array. No changes to the cart itself.

See `docs/design.md` for more.

## Adding a new promotion
1. Create `src/rules/YourNewRule.js` with a class exposing `apply({ items, promoCode, catalog, currentDiscount })`.
2. The method returns `{ items, discount }` — possibly-modified items and any extra discount to subtract.
3. Add an instance to `defaultPricingRules` in `src/rules/index.js`.
4. Add a test covering it.

That's it. No changes to `ShoppingCart.js` needed.
