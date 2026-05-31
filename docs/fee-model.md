# Fee Model (to validate before scaling)

The entire value proposition — "lower merchant fees than cards" — rests on the per-transaction economics. This must be filled in with **real TrueLayer live pricing** (verify during Stage 2/5), not assumptions.

## Comparison template

| Scenario          | Sale   | Card cost (est.)                | Pay-by-Bank (PIS) cost | PbB wins?   |
| ----------------- | ------ | ------------------------------- | ---------------------- | ----------- |
| Barber haircut    | £25.00 | ~1.5–1.75% + fixed ≈ £0.40–0.50 | flat fee `£?` (TBC)    | likely yes  |
| Food-stall coffee | £4.00  | ~%+fixed ≈ £0.10–0.20           | flat fee `£?` (TBC)    | **unclear** |

## Why this matters

- A **flat** PIS fee wins big on larger tickets (haircuts) but can _lose_ on tiny tickets (a £4 coffee) where a card's percentage is small.
- The two launch segments may therefore have **opposite economics**. Decide which segment to lead with based on real numbers.

## To fill in (Stage 2 / Stage 5)

1. TrueLayer live per-transaction PIS price (and any monthly/minimums).
2. Realistic card costs for the target merchants (their current provider).
3. Break-even ticket size where Pay-by-Bank beats cards.
4. Conclusion: which segment to lead with, and the headline saving to put in the merchant-interview script.

> Reminder: "would merchants prefer it" is ultimately answered by talking to ~10 merchants with these numbers + a working demo — not by more code.
