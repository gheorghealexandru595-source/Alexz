# 02 — Produsul, varianta gratuită și Payhip

## Produsul principal: The Uneven Paycheck Kit v1.0

- **Format:** Google Sheets (link „Make a copy” într-un PDF de o pagină). Merge pe telefon și pe laptop, gratuit pentru cumpărător.
- **Preț:** 17 $ (preț de lansare 14 $ cu cuponul `STEADY3`, 72 de ore).
- **Promisiunea într-o frază:** *The Uneven Paycheck Kit helps tip, shift and gig workers know exactly what they can spend each week in 10 minutes, without pretending they get the same paycheck every month.*

### Cum funcționează (metoda, explicată simplu)
1. **Baseline (numărul sigur):** omul scrie ce a câștigat în ultimele 8–12 săptămâni. Foaia ia **săptămâna cea mai slabă realistă** (media celor mai slabe 3 săptămâni). Asta e suma pe care își face bugetul, nu media. Aceeași idee apare la Ramsey Solutions: bugetul se face pe cea mai mică lună estimată.
2. **Fiecare săptămână:** scrie ce a încasat. Foaia împarte automat:
   - *Bills set-aside*: cât trebuie pus deoparte săptămâna asta ca chiria și facturile să fie acoperite la scadență;
   - *Tax jar*: procentul ales de om (implicit 0%, cu notă „ask a tax professional what fits you”);
   - *Safe to spend*: suma pe care o poate cheltui liniștit;
   - *Extra*: tot ce trece peste baseline merge în **Buffer** (perna pentru săptămânile slabe), apoi în economii.
3. **Săptămână slabă:** dacă încasează sub baseline, foaia îi arată cât ia din Buffer.
4. **Culori:** verde = ești ok, galben = atenție, roșu = folosește buffer-ul.

### Tab-urile
| Tab | Ce face |
|-----|---------|
| START HERE | 5 pași de pornire, se citesc într-un minut |
| Baseline | 12 rânduri de venit, calculează numărul sigur |
| Bills Calendar | Chirie, facturi, abonamente, cu ziua scadenței |
| This Week | Scrii venitul săptămânii și primești cele 4 sume |
| Buffer Tracker | Cât ai în perna de siguranță și câte săptămâni slabe acoperă |
| Year View | 52 de săptămâni, grafic simplu |
| Rent Week Plan | Lista pentru săptămâna cu chiria |

### Promptul de construcție (lipește-l în Claude)
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
Apoi verifică **fiecare formulă** cu date de test (AI-ul greșește formulele des, Vol. 1, cap. 3).

## Varianta gratuită (lead magnet): Lowest-Week Calculator
Un singur tab: scrii 8 săptămâni de venit și primești numărul sigur, plus o notă pe ultima linie: *„Want the sheet that tells you what to do with it every week? → The Uneven Paycheck Kit.”* O dai la schimb pe email, pe Payhip, la 0 $.

## Scara de produse (Vol. 2, cap. 3), după primele 30 de vânzări
| Treapta | Preț | Produs |
|---------|------|--------|
| Gratuit | 0 $ | Lowest-Week Calculator |
| Mic | 9 $ | 30-Day No-Spend Reset for Uneven Pay |
| Principal | 17 $ | The Uneven Paycheck Kit |
| Pachet | 39 $ | Kit + Side-Gig Income Tracker + Holiday & Birthday Sinking Funds |
| Premium | 79 $ | Mini-curs video cu Nora (clipuri de 3–6 min în Flow, cu Extend) + toate template-urile |
| Abonament | 7 $/lună | Template nou + provocare nouă în fiecare lună (doar după 1.000 de emailuri) |

## Pagina de produs pe Payhip (copiază)
```
The Uneven Paycheck Kit
Know what you can spend this week, even when every paycheck is different.

Sound familiar?
- "Every budget app assumes I get the same paycheck."
- "Good week, I overspend. Bad week, I panic."
- "Rent week is always a nightmare."

What's inside
- A Google Sheet you copy in one click (phone or laptop)
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
1. Copy the sheet.
2. Type your last 8 weeks of income.
3. Every payday, type one number and follow the colours.

FAQ
Format? Google Sheets. Free Google account needed.
Devices? Phone, tablet, laptop.
Instant access? Yes, the link arrives by email right after checkout.
Refunds? If it doesn't work for you, email within 14 days for a full refund.

Made by Nora, an AI creator. Templates built and tested by a real human.
```

## Cele 3 emailuri pentru cine descarcă varianta gratuită (Payhip newsletter)

**Email 1 — imediat**
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

**Email 2 — ziua 2**
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

**Email 3 — ziua 4**
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

## Setarea Payhip (rezumat din Vol. 1, cap. 4)
1. Cont gratuit (Free Forever, 0 $/lună, 5% comision), magazin numit **Steady with Nora**.
2. Settings → Payments: Stripe + PayPal. Moneda: USD. Activează TVA UE/UK și întreabă un contabil (PFA/SRL).
3. Add Product → Digital Download (PDF cu link-ul „Make a copy”).
4. Varianta gratuită ca al doilea produs, la 0 $.
5. Upsell după cumpărare: pachetul de 39 $. Cupoane: `WELCOME20`, `STEADY3`.
6. Link-ul din bio duce **direct la varianta gratuită**.
7. Test: cupon de 100%, cumpără-ți singur produsul și verifică emailul.
