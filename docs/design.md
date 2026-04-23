# Shopping Cart — Design Doc

## Goal
Implement the Amaysim shopping cart exercise in plain JavaScript (Node.js), with Jest for tests. See the exercise brief in `README (1).md`.

## Key design decision: pricing rules as strategy objects
The exercise says *"the rules around this need to be as flexible as possible as they can change with little notice"*. We model each pricing rule as its own class that exposes a uniform `apply(context)` method. The `ShoppingCart` simply iterates over a list of rule objects and asks each one to apply itself.

This is the **Strategy pattern**. Its payoff:
- Adding a new *type* of promo = adding a new class. No central engine to modify.
- Each rule is a ~15-line file that can be read, tested, and explained in isolation.
- The list of active rules is itself data — so the same cart code supports any combination of promos.

## Rule interface
Every rule class implements:
```js
apply({ items, promoCode, catalog, currentDiscount }) -> { items, discount }
```
- **Input** `items`: the items currently in the cart (possibly already modified by earlier rules).
- **Input** `promoCode`: the promo code the customer entered, if any.
- **Input** `catalog`: the product catalog, so a rule can look up prices of items it adds.
- **Input** `currentDiscount`: sum of discounts contributed by earlier rules (used by the percent-off promo so it applies to the net, not the original subtotal).
- **Output** `items`: the (possibly modified) list. A rule may add zero-priced bundle items, or reduce an item's price for a bulk discount.
- **Output** `discount`: the amount this rule subtracts from the total.

## The four rules
| Rule | Strategy |
| --- | --- |
| `ThreeForTwoRule` | Count matching items; for every 3, subtract 1× price from the discount. |
| `BulkDiscountRule` | If qty ≥ threshold, rewrite each matching item's price to the new price. |
| `FreeBundleRule` | For each trigger item, push a zero-priced free item into `items`. |
| `PercentOffPromoRule` | If `promoCode` matches, add `(subtotal − currentDiscount) × percent%` to discount. |

## Rule order
Order in the `pricingRules` array matters only for `PercentOffPromoRule`, which must run *last* so it sees the net subtotal after other rules have modified items and added discounts. The other three commute (they touch disjoint products).

## Money precision
JavaScript uses IEEE-754 floats, which can't represent some decimals exactly (`0.1 + 0.2 !== 0.3`). For this exercise the four expected totals all work cleanly and we round the final total to 2 decimals with `Math.round(n * 100) / 100`. A production system should use integer cents or a decimal library — this is noted as a teaching point in the code.

## Testing
Five Jest tests in one file:
1–4. The four scenarios from the brief, verbatim. Between them they exercise all four rules.
5. Empty cart returns total 0 (proves the pipeline doesn't crash on the trivial case).

Per-rule unit tests are deliberately omitted — the scenarios already prove each rule works, and duplicating them would add noise without value.

## File layout
```
src/
  ShoppingCart.js
  catalog.js
  rules/
    ThreeForTwoRule.js
    BulkDiscountRule.js
    FreeBundleRule.js
    PercentOffPromoRule.js
    index.js
tests/
  ShoppingCart.test.js
demo.js
package.json
README.md
docs/design.md      (this file)
```
