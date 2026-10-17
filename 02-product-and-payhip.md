# 02 — The product, the free version and Payhip

## The main product: The Uneven Paycheck Kit v1.0

- **Format:** Google Sheets ("Make a copy" link inside a one-page PDF). Works on phone and laptop, free for the buyer.
- **Price:** $17 (launch price $14 with the code `STEADY3`, 72 hours).
- **The promise in one sentence:** *The Uneven Paycheck Kit helps tip, shift and gig workers know exactly what they can spend each week in 10 minutes, without pretending they get the same paycheck every month.*

### How it works (the method, in plain words)
1. **Baseline (the safe number):** the user types what they earned in the last 8–12 weeks. The sheet takes the **realistic lowest week** (the average of the 3 lowest weeks). That's the amount they budget from, not the average. Ramsey Solutions gives the same advice: budget from your lowest estimated month.
2. **Every week:** they type what they earned. The sheet splits it automatically:
   - *Bills set-aside*: how much to put aside this week so rent and bills are covered when due;
   - *Tax jar*: the percentage the user chooses (default 0%, with the note "ask a tax professional what fits you");
   - *Safe to spend*: the amount they can spend without worry;
   - *Extra*: anything above the baseline goes into the **Buffer** (the cushion for slow weeks), then into savings.
3. **Slow week:** if they earn less than the baseline, the sheet shows how much to take from the Buffer.
4. **Colours:** green = you're fine, yellow = careful, red = use the buffer.

### The tabs
| Tab | What it does |
|-----|--------------|
| START HERE | 5 setup steps, readable in one minute |
| Baseline | 12 income rows, calculates the safe number |
| Bills Calendar | Rent, bills, subscriptions, with the due day |
| This Week | Type the week's income and get the 4 amounts |
| Buffer Tracker | How much is in the cushion and how many slow weeks it covers |
| Year View | 52 weeks, a simple chart |
| Rent Week Plan | The checklist for rent week |

### The build prompt (paste it into Claude)
```
You are a senior digital product designer for the US/UK market.
Build "The Uneven Paycheck Kit v1.0", a Google Sheets budget for people paid
different amounts every week (servers, bartenders, shift workers, delivery drivers,
freelancers). Price $17.
Tabs: START HERE, Baseline, Bills Calendar, This Week, Buffer Tracker, Year View,
Rent Week Plan.
For each tab give me: exact columns, data types, every formula (Google Sheets syntax),
conditional formatting rules (green/yellow/red), 3 rows of realistic example data
in US dollars, and protected cells.
Logic: baseline = average of the 3 lowest weeks out of the last 8-12. Each week:
income -> bills set-aside (bills due before next payday, prorated) -> tax jar
(user % , default 0) -> safe-to-spend capped at baseline minus set-asides ->
anything above baseline goes to Buffer. If income < baseline, show the amount to
pull from Buffer.
Add a light and a dark colour palette (hex) using sage #8FA98B, cream #F4EFE6,
terracotta #C0563A, charcoal #2B2B2B, and a Canva font pairing.
No tax, investing or debt advice. US English.
```
Then check **every formula** with test data (AI gets formulas wrong more often than you'd think, Vol. 1, ch. 3).

## The free version (lead magnet): Lowest-Week Calculator
A single tab: type 8 weeks of income and get the safe number, plus a note on the last line: *"Want the sheet that tells you what to do with it every week? → The Uneven Paycheck Kit."* Give it away in exchange for an email, on Payhip, at $0.

## The product ladder (Vol. 2, ch. 3), after the first 30 sales
| Step | Price | Product |
|------|-------|---------|
| Free | $0 | Lowest-Week Calculator |
| Small | $9 | 30-Day No-Spend Reset for Uneven Pay |
| Core | $17 | The Uneven Paycheck Kit |
| Bundle | $39 | Kit + Side-Gig Income Tracker + Holiday & Birthday Sinking Funds |
| Premium | $79 | Mini video course with Nora (3–6 min clips made in Flow with Extend) + all templates |
| Membership | $7/month | A new template + a new challenge every month (only after 1,000 emails) |

## The Payhip product page (copy it)
```
The Uneven Paycheck Kit
Know what you can spend this week, even when every paycheck is different.

Sound familiar?
- "Every budget app assumes I get the same paycheck."
- "Good week, I overspend. Bad week, I panic."
- "Rent week is always a nightmare."

What's inside
- One spreadsheet file: open it in Google Sheets, Excel or Numbers (phone or laptop)
- Baseline tab: finds the weekly number you can count on
- This Week tab: type what you earned, get 4 numbers: bills set-aside,
  tax jar, safe to spend, buffer
- Bills Calendar with due dates, so rent never sneaks up on you
- Buffer Tracker: see how many slow weeks you're covered for
- Rent Week Plan and a 52-week Year View
- A one-minute START HERE page

Who it's for
Servers, bartenders, nurses on shifts, delivery and rideshare drivers,
freelancers, anyone paid by the week, the shift or the tip.

Who it's not for
If your paycheck is the same every month, a regular budget will do.
This isn't tax, debt or investing advice.

How it works
1. Download the file and open it in Google Sheets or Excel.
2. Type your last 8 weeks of income.
3. Every payday, type one number and follow the colours.

FAQ
Format? A spreadsheet (.xlsx). Opens in Google Sheets (free), Excel or Numbers.
Devices? Phone, tablet, laptop.
Instant access? Yes, you download it right after checkout and get it by email too.
Refunds? If it doesn't work for you, email within 14 days for a full refund.

Made by Nora, an AI creator. Templates built and tested by a real human.
```

## The 3 emails for people who download the free version (Payhip newsletter)

**Email 1 — instant**
```
Subject: Your Lowest-Week Calculator is here
Preview: Your number takes 3 minutes.

Hi,
Here's your calculator: [LINK]
Quick win for today: type your last 8 weeks of pay (rough is fine)
and look at the green box. That's your safe weekly number. Plan around
that one, not your best week.
Talk soon,
Nora
(an AI creator, templates made by a real human)
```

**Email 2 — day 2**
```
Subject: The rent-week trick
Preview: Split rent across 4 paydays, not 1.

Hi,
Most rent-week panic comes from paying rent out of one paycheck.
Divide your rent by the number of paydays before it's due, and move
that slice every payday. Rent week stops being scary.
The Uneven Paycheck Kit does this for every bill automatically: [LINK]
Nora
```

**Email 3 — day 4**
```
Subject: 20% off, for 48 hours
Preview: The full kit, for less than a takeout order.

Hi,
If the calculator helped, the full kit tells you what to do with every
paycheck: bills set-aside, tax jar, safe to spend and buffer, in one sheet.
Code WELCOME20 takes 20% off until [DATE + 48h]: [LINK]
No pressure at all. The free calculator is yours to keep.
Nora
```

## Payhip setup (summary of Vol. 1, ch. 4)
1. Free account (Free Forever, $0/month, 5% fee), store named **Steady with Nora**.
2. Settings → Payments: Stripe + PayPal. Currency: USD. Turn on EU/UK VAT and ask an accountant (Romanian PFA/SRL).
3. Add Product → Digital Download (the PDF with the "Make a copy" link).
4. The free version as a second product, at $0.
5. Post-purchase upsell: the $39 bundle. Coupons: `WELCOME20`, `STEADY3`.
6. The bio link goes **straight to the free version**.
7. Test: make a 100% coupon, buy your own product and check the email.
