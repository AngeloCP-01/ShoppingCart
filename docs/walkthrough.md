# Walkthrough — Understanding the Solution In Depth

This is a teaching document. It walks through every concept in the shopping cart code, from JavaScript fundamentals up to the design patterns we used, so you can explain the "what, how, and why" of every line.

---

## Table of contents

1. [JavaScript fundamentals used](#1-javascript-fundamentals-used)
2. [The big picture — how the system flows](#2-the-big-picture--how-the-system-flows)
3. [The Strategy pattern — deep dive](#3-the-strategy-pattern--deep-dive)
4. [The Open/Closed Principle](#4-the-openclosed-principle)
5. [File-by-file walkthrough](#5-file-by-file-walkthrough)
6. [Tricky parts and the reasoning behind them](#6-tricky-parts-and-the-reasoning-behind-them)
7. [How to explain this in an interview](#7-how-to-explain-this-in-an-interview)

---

## 1. JavaScript fundamentals used

Before diving into the code, a quick tour of every JavaScript feature the solution uses. If any of these are unfamiliar, stop and make sure you understand them — the rest won't make sense otherwise.

### 1.1 CommonJS modules (`require` / `module.exports`)

Node's oldest module system. Each `.js` file is its own module. To share something between files:

```js
// catalog.js — the "exporting" file
const catalog = { /* ... */ };
module.exports = catalog;
```

```js
// ShoppingCart.js — the "importing" file
const catalog = require('./catalog');   // './' means "same folder"
```

Everything on the right side of `module.exports =` becomes what other files receive. You can export anything: a value, a class, an object containing many things.

**Two other forms you'll see:**
```js
module.exports = { foo, bar, baz };     // named exports via an object
const { foo } = require('./x');          // destructure just `foo` out of it
```

That's how `rules/index.js` exports multiple classes and how `ShoppingCart.test.js` pulls out just `defaultPricingRules`.

### 1.2 Classes and constructors

A `class` is JavaScript's sugar over its older prototype-based OOP. A class has:
- A `constructor` — runs when you create an instance with `new`.
- Methods — functions attached to instances.

```js
class ThreeForTwoRule {
  constructor(productCode) {
    this.productCode = productCode;   // `this` is the instance being built
  }
  apply(context) { /* ... */ }
}

const rule = new ThreeForTwoRule('ult_small');
rule.apply({ items, promoCode, catalog });
```

### 1.3 Arrow functions

Shorthand for writing functions. Two equivalent forms:

```js
function double(n) { return n * 2; }   // traditional
const double = n => n * 2;              // arrow function
```

When an arrow function has one expression, the result is returned automatically. If it has multiple statements, wrap the body in `{}` and use explicit `return`:

```js
const add = (a, b) => a + b;
const doStuff = n => {
  const x = n * 2;
  return x + 1;
};
```

We use arrow functions constantly — in `.filter`, `.map`, `.reduce`, inside `forEach`. They're more concise than `function` for small callbacks.

### 1.4 Array methods: `filter`, `map`, `reduce`

These three are used in every rule and in the cart's `total` getter.

**`.filter(fn)`** — returns a new array with only the items where `fn(item)` is truthy:
```js
const matching = items.filter(i => i.code === 'ult_small');
// Items where code is 'ult_small' survive. The original array is untouched.
```

**`.map(fn)`** — returns a new array where each item has been transformed by `fn`:
```js
const modifiedItems = items.map(item =>
  item.code === 'ult_large' ? { ...item, price: 39.90 } : item
);
// Each ult_large gets a new object with a lower price; others pass through.
```

**`.reduce(fn, initial)`** — folds the array down to a single value. The callback receives the running total and each item:
```js
const subtotal = items.reduce((sum, item) => sum + item.price, 0);
// Start at 0, add each item's price. End with the total.
```

Reduce is the most powerful of the three. Filter and map are reduce with a specific shape baked in.

### 1.5 Spread operator (`...`)

Three uses, all appearing in our code:

**Spreading into an object** — shallow-copy all fields, possibly overriding some:
```js
const cheaper = { ...item, price: 39.90 };
// cheaper has everything item had, except price is 39.90.
```

**Spreading into an array** — shallow-copy the array:
```js
const newItems = [...items];
newItems.push(freebie);  // newItems has freebie; items does not.
```

**Rest parameters (opposite direction)** — collect arguments into an array:
```js
function fn(first, ...others) { /* others is an array */ }
```
(We don't actually use this form in the cart, but you'll see it everywhere.)

### 1.6 Destructuring assignment

Pulls fields out of an object into named variables:

```js
apply({ items, promoCode, catalog, currentDiscount = 0 }) {
  // Same as: const items = ctx.items; const promoCode = ctx.promoCode; etc.
  // The `= 0` is a default value used when currentDiscount is undefined.
}
```

Same idea for arrays:
```js
const [first, second] = [10, 20];   // first = 10, second = 20
```

We destructure the rule's `context` argument directly in the parameter list. This is a very common JS pattern — reads like "these are the fields I care about."

### 1.7 Getters

A property that looks like a field from the outside but runs code when you read it:

```js
class ShoppingCart {
  get total() {
    // Runs every time someone reads cart.total
    const { items, discount } = this._applyRules();
    return /* ... */;
  }
}

cart.total;    // NOT cart.total() — no parentheses
```

From the outside, `cart.total` and `cart.items` look like plain properties. Inside, they run the whole rule pipeline. This is how we get the interface the exercise brief describes (`cart.total`, not `cart.total()`).

### 1.8 Template literals

Backtick-quoted strings that support interpolation:

```js
throw new Error(`Unknown product code: ${productCode}`);
```

The `${...}` parts are evaluated and concatenated into the string.

### 1.9 Object shorthand

When a field's key matches its variable name:

```js
const items = [];
const discount = 0;
return { items, discount };   // shorthand for { items: items, discount: discount }
```

---

## 2. The big picture — how the system flows

Here's what happens when you write this code and then read `cart.total`:

```js
const cart = new ShoppingCart(defaultPricingRules);
cart.add('ult_small');
cart.add('ult_small');
cart.add('ult_small');
cart.add('ult_large');
cart.total;   // ← this line
```

### Step-by-step

1. **`new ShoppingCart(defaultPricingRules)`** creates a cart with 4 rule objects in its `pricingRules` array and two empty internal fields: `_rawItems = []` and `_promoCode = null`.

2. **`cart.add('ult_small')`** looks up `'ult_small'` in the catalog and pushes a *copy* of the product into `_rawItems`. Three more calls → `_rawItems` now has 3 ult_small and 1 ult_large objects. No rules have run yet.

3. **Reading `cart.total`** triggers the `get total()` getter. The getter calls `_applyRules()`, which is the heart of the system.

4. **Inside `_applyRules()`**:
   - Start with a fresh copy of `_rawItems` and `discount = 0`.
   - Loop through every rule in `pricingRules`, in order.
   - For each rule, call `rule.apply({ items, promoCode, catalog, currentDiscount })`.
   - Each rule returns `{ items, discount }` — possibly-modified items and its contribution to the discount.
   - Replace `items` with the returned value; add the returned `discount` to the running total.
   - After all rules have run, return the final `{ items, discount }`.

5. **Back in `get total()`**, compute the subtotal by summing `item.price` across all items, then subtract `discount`, then round to 2 decimals. That's the number returned.

### Visualising the pipeline

```
_rawItems: [ult_small, ult_small, ult_small, ult_large]
   │
   ▼ copy (so rules can't mutate the original)
items: [ult_small, ult_small, ult_small, ult_large]   discount: 0
   │
   ▼ ThreeForTwoRule.apply — detects 3 ult_small → discount += 24.90
items: (unchanged)                                    discount: 24.90
   │
   ▼ BulkDiscountRule.apply — 1 ult_large, < 4 → no-op
items: (unchanged)                                    discount: 24.90
   │
   ▼ FreeBundleRule.apply — 0 ult_medium → no-op
items: (unchanged)                                    discount: 24.90
   │
   ▼ PercentOffPromoRule.apply — no promo code → no-op
items: (unchanged)                                    discount: 24.90
   │
   ▼ subtotal = 3×24.90 + 44.90 = 119.60
   ▼ total = round2(119.60 - 24.90) = 94.70
```

This is the whole machine. Every scenario follows the same pipeline — only the items and rule hits change.

---

## 3. The Strategy pattern — deep dive

### What it is

The Strategy pattern is a way to make behavior **swappable** and **composable**. You define a common interface (a shape of method), and then multiple classes all implement that interface. A "context" (in our case, `ShoppingCart`) holds one or more strategy objects and delegates to them.

The key idea: the context doesn't know or care what each strategy *does* internally. It just knows the shape.

### The shape in our code

Every rule exposes:

```js
apply({ items, promoCode, catalog, currentDiscount }) -> { items, discount }
```

That's the "contract." As long as a class implements this method with this signature and return shape, the cart can use it as a rule. This is **duck typing** — "if it quacks like a rule, it's a rule." JavaScript doesn't enforce interfaces at the language level, so the discipline is on us to keep the shape consistent.

### Why we used it here

The exercise brief literally says: *"the rules around this need to be as flexible as possible as they can change with little notice."* That's a neon sign pointing at Strategy.

Consider the alternative: one big function with a switch/if-else tree:

```js
// WITHOUT Strategy — everything stuffed into the cart
function calculateTotal(items, promoCode) {
  let discount = 0;

  // 3-for-2 on ult_small
  const smallCount = items.filter(i => i.code === 'ult_small').length;
  discount += Math.floor(smallCount / 3) * 24.90;

  // Bulk discount on ult_large
  const largeCount = items.filter(i => i.code === 'ult_large').length;
  if (largeCount >= 4) {
    items = items.map(i => i.code === 'ult_large' ? {...i, price: 39.90} : i);
  }

  // Free 1gb with each ult_medium
  const mediumCount = items.filter(i => i.code === 'ult_medium').length;
  for (let i = 0; i < mediumCount; i++) items.push({code: '1gb', price: 0});

  // I<3AMAYSIM promo
  if (promoCode === 'I<3AMAYSIM') {
    const subtotal = items.reduce((s, i) => s + i.price, 0);
    discount += (subtotal - discount) * 0.1;
  }

  return /* ... */;
}
```

This works. But every time marketing adds a new promo, someone has to open this file, wedge a new `if` block in the right spot, and hope they don't break anything. And testing one specific rule means running the whole thing.

With Strategy:
- Each rule lives in its own file.
- Each rule can be read in isolation.
- Each rule can be tested in isolation.
- Adding a new rule type means writing a new file — never touching `ShoppingCart.js`.

### Strategy in plain English

"Instead of one function that does every kind of discount, each kind of discount is its own small class. A list of them gets passed to the cart. The cart doesn't care what any individual class does — it just asks each one to `apply` itself in order."

---

## 4. The Open/Closed Principle

This is one of the five SOLID principles. It states:

> Software entities should be **open for extension, closed for modification**.

Translated: you should be able to add new behavior without editing existing code.

Our `ShoppingCart` class is **closed for modification** — to add a new kind of promotion, you don't touch it. But the system is **open for extension** — you just drop in another rule class.

This is a design ideal, not a law. In practice you balance it against YAGNI ("don't over-abstract for hypothetical needs"). In this case the brief tells us explicitly that promos change often, so the extra design effort is justified.

---

## 5. File-by-file walkthrough

### 5.1 `src/catalog.js`

A single object keyed by product code. Each value has `code`, `name`, `price`.

**Why an object and not an array?** Because we look up products by code (`catalog['ult_small']`) — that's O(1). With an array we'd have to scan with `.find` every time. Objects-as-dictionaries are JavaScript's default for key-value lookups.

**Why include `code` inside each value too?** So if you hold a product reference in isolation, you still know its code. The key and the value's `code` field are always the same; that's a small duplication we accept for convenience.

### 5.2 The rules

All four files share the same skeleton:

```js
class SomeRule {
  constructor(/* config */) { /* store config */ }
  apply({ items, promoCode, catalog, currentDiscount }) {
    // 1. check if the rule applies
    // 2. compute changes
    // 3. return { items, discount }
  }
}
module.exports = SomeRule;
```

Let's look at each in detail.

---

#### 5.2.1 `ThreeForTwoRule`

**Logic:** for every 3 matching items, give 1 free.

```js
const matching = items.filter(i => i.code === this.productCode);
const freeCount = Math.floor(matching.length / 3);
if (freeCount === 0) return { items, discount: 0 };
const unitPrice = matching[0].price;
return { items, discount: freeCount * unitPrice };
```

**Reading it:**
- `.filter` pulls out only the matching items.
- `Math.floor(n / 3)` gives us the number of "free groups" — with 5 items, `Math.floor(5/3) = 1` free. With 7, it's 2. With 3, exactly 1.
- We return the items unchanged and add a discount equal to `freeCount × unitPrice`.

**Why read `matching[0].price` instead of using the catalog directly?** Because an earlier rule might have modified the price (although no such rule exists here). Reading from the current `items` array means this rule cooperates correctly with any rule that runs before it.

**Why no modification to items?** Because the customer still *gets* 3 SIMs — they just *pay* for 2. The items on the receipt are unchanged; only the money is less.

---

#### 5.2.2 `BulkDiscountRule`

**Logic:** if at least N of the matching product are in the cart, rewrite each one's price.

```js
const count = items.filter(i => i.code === this.productCode).length;
if (count < this.minQty) return { items, discount: 0 };
const modifiedItems = items.map(item =>
  item.code === this.productCode ? { ...item, price: this.newPrice } : item
);
return { items: modifiedItems, discount: 0 };
```

**Reading it:**
- Count matching items.
- If below threshold, no-op.
- `.map` walks the whole array; for matching items it returns `{ ...item, price: newPrice }` (copy with price overridden); for non-matching it returns the item unchanged.
- We return new items but discount 0 — the saving is baked into the prices.

**Why express it as a price change rather than a discount?** Because the receipt should show the customer paying $39.90 per SIM. If we kept the price at $44.90 and subtracted a mystery discount, the receipt would be confusing.

**Why `.map` and not a `for` loop?** `.map` makes the intent clear: "transform every item." The callback's return value becomes the new element. A for loop would need to build a new array manually; it's more code and more room for bugs.

**Why the spread (`...item`)?** To avoid mutating the original. `item.price = newPrice` would change the object that also lives in the catalog and `_rawItems`. That breaks isolation. Always build a new object when you need changes.

---

#### 5.2.3 `FreeBundleRule`

**Logic:** for each `triggerCode` item, add a `freeCode` item at price 0.

```js
const triggerCount = items.filter(i => i.code === this.triggerCode).length;
if (triggerCount === 0) return { items, discount: 0 };
const freeProduct = catalog[this.freeCode];
const newItems = [...items];
for (let i = 0; i < triggerCount; i++) {
  newItems.push({ ...freeProduct, price: 0 });
}
return { items: newItems, discount: 0 };
```

**Reading it:**
- Count triggers.
- If none, no-op.
- Look up the free product in the catalog (to get its name).
- Spread the existing items into a new array.
- Push one free copy per trigger.

**Why push zero-priced items instead of applying a discount equal to their price?** Because the brief's scenario 3 expects the free 1GB data-packs to appear in `cart.items`. The customer should see what they're getting. If we only subtracted the price, the items list would be wrong.

**Why `[...items]` rather than just pushing to `items`?** Same reason as before — we don't want to mutate the caller's array. Everyone keeps their own copy.

---

#### 5.2.4 `PercentOffPromoRule`

**Logic:** if the promo code matches, add N% of the current net as discount.

```js
if (promoCode !== this.code) return { items, discount: 0 };
const subtotal = items.reduce((sum, item) => sum + item.price, 0);
const netAfterOtherRules = subtotal - currentDiscount;
return { items, discount: netAfterOtherRules * (this.percent / 100) };
```

**Reading it:**
- First, bail if the customer didn't enter this promo.
- Sum item prices to get subtotal.
- Subtract `currentDiscount` to get the net the customer would owe after other rules.
- 10% of that net is the extra discount this rule contributes.

**Why "net after other rules" instead of 10% of the original list price?** Because the business decision is that promos stack on top of existing deals, not on top of full prices. With a cart of 3 ult_small + promo:
- Option A: 10% off 74.70 (list) = 7.47 off, on top of the 3-for-2's 24.90 savings → 42.33
- Option B: 10% off (74.70 - 24.90) = 10% off 49.80 = 4.98 off → 44.82

We chose Option B — the less generous interpretation, which is what "10% off your total" typically means.

**Why does `currentDiscount` come from outside this rule?** Because the rule has no way to know what other rules have done — it just sees the current state. The cart knows, and passes it in.

**Why is rule order important here?** If this rule ran first, `currentDiscount` would be 0, and 10% would apply to the full subtotal. We've documented in the default rule array that promo rules go last.

---

### 5.3 `src/rules/index.js`

A "barrel" — re-exports the four rule classes and a pre-built list of default rules matching the brief.

```js
const defaultPricingRules = [
  new ThreeForTwoRule('ult_small'),
  new BulkDiscountRule('ult_large', 4, 39.90),
  new FreeBundleRule('ult_medium', '1gb'),
  new PercentOffPromoRule('I<3AMAYSIM', 10),
];
```

**This is where promos are configured.** Notice each line is a single constructor call with the specific config for this product. Change a threshold or a price here, and everywhere that uses `defaultPricingRules` sees the change.

**Why pre-construct the instances here?** Because the list is shared — every caller gets the same set of rule instances. These rules hold no state between calls (they only act on the context passed in), so sharing is safe and saves creating duplicates.

---

### 5.4 `src/ShoppingCart.js`

The class that ties everything together. Three public surfaces (`add`, `total`, `items`) and one private pipeline (`_applyRules`).

#### `constructor(pricingRules = [])`

Stores the rule array and initializes empty raw items / no promo. The default `[]` means a cart with no rules is legal — it just returns whatever items are added, with no discounts. That's useful for testing and keeps the class robust.

#### `add(productCode, promoCode = null)`

```js
const product = catalog[productCode];
if (!product) throw new Error(`Unknown product code: ${productCode}`);
this._rawItems.push({ ...product });
if (promoCode) this._promoCode = promoCode;
```

Four things to notice:
1. Look up by code, not by passing a full product object — the cart only deals in codes, keeping the interface clean.
2. Throw on unknown codes — fail fast on typos. Silent failures are the worst.
3. Spread the product before pushing — isolation again.
4. Promo code is stashed on the cart, not per-item. The brief only describes one promo code at a time, so one slot is enough.

#### `_applyRules()`

```js
let items = this._rawItems.map(item => ({ ...item }));
let discount = 0;
for (const rule of this.pricingRules) {
  const result = rule.apply({
    items,
    promoCode: this._promoCode,
    catalog,
    currentDiscount: discount,
  });
  items = result.items;
  discount += result.discount;
}
return { items, discount };
```

The core loop. Reading it top to bottom:
- Start from a fresh copy of raw items. Every call to this method begins from the same baseline — calling `total` twice doesn't double-apply rules.
- Iterate rules in array order.
- Each iteration replaces `items` and accumulates `discount`.
- Return the final state.

**Why the underscore on `_applyRules`?** It's a convention meaning "don't call this from outside." Not enforced by JS, but visible to other humans. Private method (`#`) syntax exists in modern JS but is less widely used in tutorial/interview contexts.

#### `get items()` and `get total()`

Both call `_applyRules()` and pick out what they need. Every read recomputes. This is fine for small carts — microseconds.

---

### 5.5 `tests/ShoppingCart.test.js`

Five tests, one `describe` block. The `describe` is just a label for grouping.

**Integration vs unit tests:** these are *integration tests* — they use real rules, the real catalog, the real cart. No mocking. We trust that if the public interface returns the right totals for the right scenarios, everything underneath is working. This is the opposite of the "test every private method" style. For pure, no-external-dependencies code like ours, it's the right choice.

**`expect(x).toBe(y)`** uses `===` comparison. Good for numbers, strings, booleans.

**`expect(x).toEqual(y)`** does deep equality. Good for arrays and objects.

**`expect(x).toHaveLength(n)`** checks `x.length === n`.

**The `itemCodes` helper** extracts codes and sorts them so we don't depend on the order items were added or inserted. This is a trick worth knowing: when testing "the contents of a collection," sort both sides first if order isn't part of the spec.

---

## 6. Tricky parts and the reasoning behind them

### 6.1 Why `total` is a getter, not a method or a stored field

Three options:
- **Stored field (`cart.total = computed value`)** — requires us to recompute and update it on every `add()`. Easy to forget; prone to staleness bugs if rules are later changed.
- **Method (`cart.total()`)** — works, but the brief's interface shows `cart.total` without parens.
- **Getter (`cart.total`)** — looks like a field, runs like a method. Always fresh.

Getter wins. The cost is that reading the same cart twice runs the rules twice. For a cart of a few items, that's microseconds. If the cart were huge and rules expensive, you'd cache — but caching is one of the hardest things to get right, so we only add it when we have a measured reason to.

### 6.2 Why we copy items so aggressively

Look at how many `{ ...item }` and `[...items]` spreads appear in the code. Every one exists to prevent mutation leaking into places that shouldn't change.

A concrete bug we avoid: if `BulkDiscountRule` did `item.price = 39.90` (direct mutation) instead of `{...item, price: 39.90}` (new object), it would change the object stored in `_rawItems`. Calling `cart.total` a second time — with raw items now mutated — would compute off already-discounted prices. A very subtle, very annoying bug.

**Rule of thumb: treat inputs as read-only. Build new data structures when you need changes.** In a language with immutable-by-default semantics you don't have to think about this; in JS you do.

### 6.3 Why `Math.round(n * 100) / 100` instead of `.toFixed(2)`

`.toFixed(2)` returns a **string**, not a number:
```js
(1.005).toFixed(2);   // "1.00" — returns a string, also rounds wrong in some cases
```

Multiplying by 100, using `Math.round`, then dividing by 100 gives us a proper number and avoids surprises. Try it:
```js
Math.round(31.319999 * 100) / 100;   // 31.32
```

### 6.4 Floating-point money — the real-world caveat

JavaScript numbers are IEEE-754 floats. Some decimals don't round-trip cleanly:
```js
0.1 + 0.2;       // 0.30000000000000004
0.1 + 0.2 === 0.3;   // false
```

For this exercise, the four expected totals happen to work out cleanly after a single rounding at the end. For a production billing system, the safer approach is:
- Store all money as **integer cents** throughout (so $24.90 becomes `2490`).
- Do all arithmetic on integers (which are exact up to 2^53).
- Format back to dollars only at the presentation layer.

This avoids floating-point surprises entirely. We noted this as a teaching point in the code rather than doing it, because the exercise's scenarios don't stress the edge cases.

### 6.5 Why rule order matters for one specific rule

Three of our four rules commute — you can apply them in any order:
- `ThreeForTwoRule` only changes discount, doesn't change items.
- `BulkDiscountRule` only changes prices on its product.
- `FreeBundleRule` only adds items (at price 0, so no subtotal impact).

But `PercentOffPromoRule` reads `currentDiscount` and `subtotal`, so it depends on what earlier rules did. It MUST be last. If we moved it to position 1, it would apply 10% to the full list price — a different business rule.

We encode this by placing it last in `defaultPricingRules`. A more defensive design would be to tag rules with a priority number and sort them — but that's future-proofing we don't need yet (YAGNI).

### 6.6 Why tests use `expect(cart.total).toBe(94.70)` and not `toBeCloseTo`

`toBeCloseTo` is for floating-point comparison where small imprecision is expected. We use `toBe` (strict equality) because our final rounding makes the result exact. If we used raw float arithmetic without rounding, `toBe` would fail on some scenarios — that'd be a signal to go look for the missing round.

---

## 7. How to explain this in an interview

Prepare these three 2-minute answers. They cover 80% of what you'd be asked.

### "Walk me through your solution."

> I modelled the four promotions as strategy objects. Each one is a small class in `src/rules/` that exposes a single `apply(context)` method returning the items and any discount it contributes. The `ShoppingCart` holds the raw items and a list of these rule objects, and its `total` getter runs the rules in order to produce the final number. The point of that structure is to make the cart indifferent to any specific promotion — adding a new kind of promo means writing one new ~15-line class and dropping an instance into the rules array. No changes to the cart.

### "Why the Strategy pattern here?"

> Because the exercise brief called out that promos change often. If I'd put every rule's logic inside the cart as a switch or an if-tree, every new promo would mean opening and re-testing that central file. With Strategy, each rule is its own file that can be read, tested, and replaced in isolation. It's the Open/Closed Principle in practice: the cart is closed for modification but the system is open for extension.

### "Trade-offs you considered?"

> Three worth mentioning. First, I used floats with a final rounding to two decimals — clean for the scenarios in the brief, but for a production billing system I'd use integer cents throughout to avoid IEEE-754 surprises. Second, `total` is a getter that recomputes on every read rather than a cached value — the safer choice given rules can change, at the cost of microseconds. Third, I only wrote integration tests against the four scenarios — they exercise every rule between them, so per-rule unit tests would have been duplication. If the codebase grew more rules, I'd probably add targeted unit tests for the ones with edge-case logic.

### Questions they might drill into

- **"What if we added a fifth product?"** → Add it to `catalog.js`. Done. No other code changes needed.
- **"What if we added a fifth rule type, like buy-one-get-one-half-price?"** → New file `src/rules/BogoHalfRule.js`. Add one line to `defaultPricingRules`. Done.
- **"What if two promos could apply to the same product?"** → Already supported — they each run against the current state. Might need to think about order, but no structural change.
- **"How would you cache `total` for performance?"** → Track a dirty flag: `add()` sets it to true, `total` clears it after computing. But only add this if profiling shows it matters — premature optimization is its own bug farm.
- **"How would you handle remove / decrement quantity?"** → Add `cart.remove(productCode)` that searches `_rawItems` for the first match and removes it. Rules don't change.

---

## Appendix: the data contract as a diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  ShoppingCart                                                   │
│                                                                 │
│    _rawItems:   [ { code, name, price }, ... ]                  │
│    _promoCode:  string | null                                   │
│    pricingRules: [ Rule, Rule, Rule, Rule ]                     │
│                                                                 │
│    add(code, promoCode?) ──► push to _rawItems, set _promoCode  │
│                                                                 │
│    _applyRules()                                                │
│    ┌─ items   = copy of _rawItems ──┐                           │
│    │  discount = 0                   │                          │
│    │                                 ▼                          │
│    │  for each rule:                                            │
│    │     { items, discount } = rule.apply({                     │
│    │         items, promoCode, catalog, currentDiscount         │
│    │     })                                                     │
│    │                                                            │
│    │  return { items, discount }                                │
│    └──────────────┬─────────────────────────────────────────────┘
│                   │                                              │
│    get items  ───►┘                                              │
│    get total  ───► items, discount ► subtotal ► round ► total    │
└─────────────────────────────────────────────────────────────────┘
```

That's the whole system. Every design decision in the code serves the shape in this diagram.
