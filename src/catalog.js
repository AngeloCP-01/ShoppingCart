// ============================================================================
// PRODUCT CATALOG
// ============================================================================
//
// Why this file exists:
//   We need ONE place that knows what products exist and what they cost. If we
//   hardcoded "24.90" in many files, a price change would mean hunting through
//   the whole codebase. By putting it here, the rest of the code only has to
//   know a product *code* ("ult_small") and can look up the rest.
//
// In a real app this would come from a database or API. A plain object is
// fine for this exercise and keeps the code dependency-free.
// ============================================================================

const catalog = {
  test_product: { code: "test_product", name: "Unlimited 500MB", price: 4.9 },
  test_product2: { code: "test_product2", name: "Unlimited 300MB", price: 2.9 },
  test_product3: {
    code: "test_product3",
    name: "Unlimited 100GB",
    price: 102.9,
  },
  ult_small: { code: "ult_small", name: "Unlimited 1GB", price: 24.9 },
  ult_medium: { code: "ult_medium", name: "Unlimited 2GB", price: 29.9 },
  ult_large: { code: "ult_large", name: "Unlimited 5GB", price: 44.9 },
  "1gb": { code: "1gb", name: "1 GB Data-pack", price: 9.9 },
};

// `module.exports` is Node's CommonJS way of saying "this is what other files
// get when they `require('./catalog')`." Exporting the whole object lets
// callers do `catalog['ult_small']` to look a product up by its code.
module.exports = catalog;
