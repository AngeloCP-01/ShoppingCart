# Amaysim Shopping Cart Exercise

Amaysim is rebuilding our shopping cart. In this new version we want to allow our customers to purchase multiple SIM cards simultaneously. You have been engaged to build this new version.

We will start with the following products in our catalogue:

| Product Code | Product Name   | Price  |
| ---          | ---            | ---    |
| ult_small    | Unlimited 1GB  | $24.90 |
| ult_medium   | Unlimited 2GB  | $29.90 |
| ult_large    | Unlimited 5GB  | $44.90 |
| 1gb          | 1 GB Data-pack | $9.90  |

As launching the new cart is kinda a big deal, we'd like to have a few special offers and promotions to attract new customers:
- A 3 for 2 deal on Unlimited 1GB Sims. So for example, if you buy 3 Unlimited 1GB Sims, you will pay the price of 2 only for the first month.
- The Unlimited 5GB Sim will have a bulk discount applied; whereby the price will drop to $39.90 each for the first month, if the customer buys more than 3.
- We will bundle in a free 1 GB Data-pack free-of-charge with every Unlimited 2GB sold.
- Adding the promo code 'I<3AMAYSIM' will apply a 10% discount across the board.

As the market tends to fluctuate in terms of pricing, the rules around this need to be as flexible as possible as they can change with little notice. Customers can add items to the cart in any order.

## Interface

The interface to our cart looks like this:

```
cart = ShoppingCart.new(pricingRules)
cart.add(item1)
cart.add(item2, promo_code)
cart.total
cart.items
```

## The Programming Exercise

Your task is to implement a shopping cart that satisfies the requirements described above and execute the following scenarios (and verify the expected outcomes):

| Scenario | Items Added | Expected Cart Total | Expected Cart Items |
| :---: | --- | --- | --- |
| 1 | 3 x Unlimited 1 GB<br>1 x Unlimited 5 GB | $94.70 | 3 x Unlimited 1 GB<br>1 x Unlimited 5 GB |
| 2 | 2 x Unlimited 1 GB<br>4 x Unlimited 5 GB | $209.40 | 2 x Unlimited 1 GB<br>4 x Unlimited 5 GB |
| 3 | 1 x Unlimited 1 GB<br>2 X Unlimited 2 GB | $84.70 | 1 x Unlimited 1 GB<br>2 X Unlimited 2 GB<br>2 X 1 GB Data-pack |
| 4 | 1 x Unlimited 1 GB<br>1 x 1 GB Data-pack<br>'I<3AMAYSIM' Promo Applied | $31.32 | 1 x Unlimited 1 GB<br>1 x 1 GB Data-pack |

## Technical Guidance

- Use **javascript**
- Don't build guis etc; we're more interested in your approach to solving the given task, not how shiny it looks
- Don't use any frameworks, or any external libraries/jars (unless they're for testing)
- Please include instructions on how to run the application & any tests

## How to submit?
1. When you're happy with your changes, push them into your repo.
2. Let the recruiter know that you're done, and what your github username is.
3. Sit back and relax. We'll review your submission and get back to you 😃
