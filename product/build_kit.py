"""Builds The Uneven Paycheck Kit v1.0 (xlsx; plain formulas so it works in Google Sheets, Excel and Numbers)."""
import sys
from openpyxl import Workbook
from openpyxl.chart import LineChart, Reference
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

SAGE, CREAM, TERRA, CHAR, GREY = "8FA98B", "F4EFE6", "C0563A", "2B2B2B", "7A7468"
GREEN, YELLOW, RED, WHITE = "DCE8D5", "FFF1C9", "F6D5CC", "FFFFFF"
MONEY = '"$"#,##0.00'
out = sys.argv[1] if len(sys.argv) > 1 else "The-Uneven-Paycheck-Kit.xlsx"

fill = lambda c: PatternFill("solid", fgColor=c)
thin = Side(style="thin", color="D8D2C6")
box = Border(left=thin, right=thin, top=thin, bottom=thin)
wb = Workbook()


def sheet(title, widths, first=False):
    ws = wb.active if first else wb.create_sheet()
    ws.title = title
    ws.sheet_view.showGridLines = False
    for col, w in widths.items():
        ws.column_dimensions[col].width = w
    for r in range(1, 70):
        for c in "ABCDEFGHIJ":
            ws[f"{c}{r}"].fill = fill(CREAM)
    return ws


def title(ws, text, sub):
    ws["B2"] = text
    ws["B2"].font = Font(name="Georgia", size=22, bold=True, color=CHAR)
    ws["B3"] = sub
    ws["B3"].font = Font(size=11, italic=True, color=CHAR)


def header(ws, row, labels, start="B"):
    for i, label in enumerate(labels):
        c = ws.cell(row=row, column=ord(start) - 64 + i, value=label)
        c.font = Font(bold=True, color=WHITE)
        c.fill = fill(SAGE)
        c.border = box
        c.alignment = Alignment(wrap_text=True, vertical="center")


def cell(ws, ref, value=None, fmt=None, bg=WHITE, bold=False, color=CHAR, size=11):
    c = ws[ref]
    if value is not None:
        c.value = value
    if fmt:
        c.number_format = fmt
    c.fill = fill(bg)
    c.border = box
    c.font = Font(bold=bold, color=color, size=size)
    return c


def note(ws, ref, text, color=GREY, italic=False):
    ws[ref] = text
    ws[ref].font = Font(size=9, color=color, italic=italic)
    ws[ref].alignment = Alignment(wrap_text=True, vertical="center")


def money_input(ws, rng, dv):
    dv.add(rng)


# ---------- START HERE ----------
s0 = sheet("START HERE", {"A": 3, "B": 6, "C": 92}, first=True)
title(s0, "The Uneven Paycheck Kit", "Know what you can spend this week, even when every paycheck is different.  v1.0")
steps = [
    ("1", "Baseline tab: type your take-home pay for your last 8 to 12 weeks. You get your SAFE WEEKLY NUMBER, "
          "the average of your 3 lowest weeks. That's what you plan around, not your best week."),
    ("2", "Bills Calendar tab: list every bill you pay each month (rent, phone, insurance...) with its amount. "
          "The sheet works out how much to set aside from every weekly paycheck so bills are always covered."),
    ("3", "Baseline tab, 'Your settings': choose a tax jar % if you want one (leave 0 if taxes are already taken "
          "out of your pay) and type how much you already have saved as a cushion."),
    ("4", "Every payday: open This Week, type what you earned, and follow the colour. It tells you the 4 numbers: "
          "bills set-aside, tax jar, safe to spend, and how much goes to (or comes from) your cushion."),
    ("5", "Then log that week in Year View so your cushion balance stays up to date. "
          "Rent coming up? Use the Rent Week Plan tab."),
]
r = 6
s0["B5"] = "Start here (takes about 10 minutes, once)"
s0["B5"].font = Font(bold=True, size=13, color=TERRA)
for n, text in steps:
    cell(s0, f"B{r}", n, bg=SAGE, bold=True, color=WHITE).alignment = Alignment(horizontal="center", vertical="center")
    c = cell(s0, f"C{r}", text)
    c.alignment = Alignment(wrap_text=True, vertical="center")
    s0.row_dimensions[r].height = 46
    r += 1
s0["B13"] = "What the colours mean"
s0["B13"].font = Font(bold=True, size=13, color=TERRA)
for i, (bg, text) in enumerate([
    (GREEN, "GREEN: you're fine. Bills are covered and something goes to your cushion."),
    (YELLOW, "YELLOW: slow week. Your cushion covers the gap, that's exactly what it's for."),
    (RED, "RED: your cushion can't cover this week. Spend only what the sheet shows and skip extras."),
]):
    cell(s0, f"B{14 + i}", "", bg=bg)
    cell(s0, f"C{14 + i}", text)
s0["B18"] = "Good to know"
s0["B18"].font = Font(bold=True, size=13, color=TERRA)
faq = [
    "White cells are yours to type in. Coloured cells calculate by themselves, please don't type over them.",
    "The example numbers are there so you can see how it works. Replace them with yours.",
    "Google Sheets: File > Make a copy (or open the file and choose 'Save as Google Sheets'). Works on phone and laptop.",
    "This is a budgeting tool, not tax, debt or investing advice. For your tax %, ask a tax professional what fits you.",
    "Made by Nora, an AI creator. Template built and tested by a real human.",
]
for i, t in enumerate(faq):
    s0[f"C{19 + i}"] = "•  " + t
    s0[f"C{19 + i}"].alignment = Alignment(wrap_text=True)
    s0.row_dimensions[19 + i].height = 30

# ---------- BASELINE ----------
s1 = sheet("Baseline", {"A": 3, "B": 36, "C": 18, "D": 58})
title(s1, "Baseline", "Your safe weekly number: the one you can count on.")
header(s1, 5, ["Week", "Take-home pay ($)"])
dv = DataValidation(type="decimal", operator="between", formula1="0", formula2="1000000", allow_blank=True,
                    showErrorMessage=True, errorTitle="Numbers only", error="Type a dollar amount, like 450.")
s1.add_data_validation(dv)
pay = [620, 380, 540, 290, 710, 450, 330, 600]
for i in range(12):
    rr = 6 + i
    cell(s1, f"B{rr}", f"Week {i + 1}")
    cell(s1, f"C{rr}", pay[i] if i < len(pay) else None, fmt=MONEY)
dv.add("C6:C17")
note(s1, "D6", "Example numbers. Replace them with your last 8-12 weeks (rough is fine).", TERRA, True)
INC = "Baseline!$C$6:$C$17"
res = [
    (20, "Your average week", f'=IF(COUNT(C6:C17)<3,"",AVERAGE(C6:C17))', "What most budgets use. It hides your slow weeks."),
    (21, "SAFE WEEKLY NUMBER", f'=IF(COUNT(C6:C17)<3,"Type at least 3 weeks",(SMALL(C6:C17,1)+SMALL(C6:C17,2)+SMALL(C6:C17,3))/3)',
     "Average of your 3 lowest weeks. Everything is planned around this."),
    (22, "Weekly spending allowance", '=IF(ISNUMBER(C21),MAX(0,C21-Bills!$C$28-C21*C26),"")',
     "Safe number minus bills set-aside and tax jar. Groceries, gas, fun: this is your steady weekly amount."),
    (23, "Check", '=IF(NOT(ISNUMBER(C21)),"",IF(Bills!$C$28+C21*C26>C21,"Bills are higher than your safe number. Look at Rent Week Plan and trim a bill.","Your bills fit inside your safe number."))', ""),
]
for rr, label, f, n in res:
    cell(s1, f"B{rr}", label, bold=True)
    cell(s1, f"C{rr}", f, fmt=MONEY, bg=GREEN if rr == 21 else WHITE, bold=rr == 21, size=13 if rr == 21 else 11)
    note(s1, f"D{rr}", n)
s1.merge_cells("C23:D23")
s1["C23"].alignment = Alignment(wrap_text=True)
s1.row_dimensions[23].height = 30
s1["B25"] = "Your settings"
s1["B25"].font = Font(bold=True, size=13, color=TERRA)
cell(s1, "B26", "Tax jar % (0 if taxes come out of your pay)")
cell(s1, "C26", 0, fmt="0%")
note(s1, "D26", "Type 0.25 or 25% for 25%. Not tax advice: ask a tax professional what fits you.")
cell(s1, "B27", "Cushion you already have saved")
cell(s1, "C27", 200, fmt=MONEY)
note(s1, "D27", "Money set aside for slow weeks. Example: $200.", TERRA, True)
pct = DataValidation(type="decimal", operator="between", formula1="0", formula2="0.6", allow_blank=True,
                     showErrorMessage=True, errorTitle="Percent", error="Use a % between 0% and 60%.")
s1.add_data_validation(pct)
pct.add("C26")
dv.add("C27")
SAFE, ALLOW, TAX, START = "Baseline!$C$21", "Baseline!$C$22", "Baseline!$C$26", "Baseline!$C$27"

# ---------- BILLS CALENDAR ----------
s2 = sheet("Bills", {"A": 3, "B": 30, "C": 18, "D": 14, "E": 44})
title(s2, "Bills Calendar", "Every bill, its amount and its due day. The sheet spreads them across your paydays.")
header(s2, 5, ["Bill", "Amount per month ($)", "Due day (1-31)", "Notes"])
bills = [("Rent", 750, 1), ("Phone", 45, 12), ("Internet", 50, 5), ("Electric", 70, 20),
         ("Car insurance", 95, 18), ("Streaming", 20, 27)]
day = DataValidation(type="whole", operator="between", formula1="1", formula2="31", allow_blank=True,
                     showErrorMessage=True, errorTitle="Day", error="Type a day of the month from 1 to 31.")
s2.add_data_validation(day)
s2.add_data_validation(dv2 := DataValidation(type="decimal", operator="between", formula1="0", formula2="1000000",
                                             allow_blank=True, showErrorMessage=True, errorTitle="Numbers only",
                                             error="Type a dollar amount."))
for i in range(20):
    rr = 6 + i
    b = bills[i] if i < len(bills) else (None, None, None)
    cell(s2, f"B{rr}", b[0])
    cell(s2, f"C{rr}", b[1], fmt=MONEY)
    cell(s2, f"D{rr}", b[2])
    cell(s2, f"E{rr}", None)
day.add("D6:D25")
dv2.add("C6:C25")
cell(s2, "B27", "Total bills per month", bold=True)
cell(s2, "C27", "=SUM(C6:C25)", fmt=MONEY, bold=True)
cell(s2, "B28", "Set aside every weekly payday", bold=True)
cell(s2, "C28", "=C27*12/52", fmt=MONEY, bg=GREEN, bold=True, size=13)
note(s2, "E28", "Monthly bills x 12 months / 52 weeks. Move this to your bills account every payday and bills are always covered.")
cell(s2, "B29", "Bills due in the next 7 days", bold=True)
cell(s2, "C29", '=SUMPRODUCT((D6:D25<>"")*(MOD(D6:D25-DAY(TODAY()),31)<7)*C6:C25)', fmt=MONEY, bg=YELLOW)
note(s2, "E29", "Counts bills whose due day falls within the next week (approximate around month ends).")
note(s2, "E6", "Example bills. Replace with yours. Groceries and gas are spending, not bills: leave them out.", TERRA, True)
BILLS_W = "Bills!$C$28"

# ---------- THIS WEEK ----------
s3 = sheet("This Week", {"A": 3, "B": 34, "C": 20, "D": 60})
title(s3, "This Week", "Every payday: type one number, follow the colour.")
cell(s3, "B5", "What I earned this week ($)", bold=True)
cell(s3, "C5", 412, fmt=MONEY, size=14, bold=True)
s3.add_data_validation(dv3 := DataValidation(type="decimal", operator="between", formula1="0", formula2="1000000",
                                             allow_blank=True, showErrorMessage=True, errorTitle="Numbers only",
                                             error="Type a dollar amount, like 412."))
dv3.add("C5")
note(s3, "D5", "Example: $412. Type your take-home pay for this week.", TERRA, True)
header(s3, 7, ["Your 4 numbers", "Amount", "What to do"])
rows = [
    (8, "1. Bills set-aside", f'=IF(C5="","",{BILLS_W})', "Move this to your bills account (or envelope) first."),
    (9, "2. Tax jar", f'=IF(C5="","",C5*{TAX})', "Set this aside for taxes. 0 if taxes come out of your pay."),
    (10, "3. Safe to spend", f'=IF(C5="","",IF(C11>=0,{ALLOW},MAX(0,MIN({ALLOW},{ALLOW}+C11+C13))))',
     "Groceries, gas, fun. Spend this and no more until next payday."),
    (11, "4. Cushion: add (+) or take (-)", f'=IF(C5="","",C5-C8-C9-{ALLOW})',
     "Positive: add it to your cushion. Negative: take it from your cushion."),
]
for rr, label, f, n in rows:
    cell(s3, f"B{rr}", label, bold=True)
    cell(s3, f"C{rr}", f, fmt=MONEY, size=13, bold=True)
    note(s3, f"D{rr}", n)
    s3.row_dimensions[rr].height = 26
cell(s3, "B13", "Cushion before this payday")
cell(s3, "C13", f"={START}+SUM('Year View'!H6:H57)", fmt=MONEY)
note(s3, "D13", "Comes from Year View. Log each week there after you've moved the money.")
cell(s3, "B14", "Cushion after this payday")
cell(s3, "C14", '=IF(C5="","",C13+C11)', fmt=MONEY)
s3.merge_cells("B16:D16")
status = ('=IF(C5="","Type what you earned this week in the box above.",'
          'IF(C11>=0,"GREEN: You\'re fine. Bills are covered. Add "&TEXT(C11,"$#,##0.00")&" to your cushion.",'
          'IF(C13+C11>=0,"YELLOW: Slow week. Take "&TEXT(-C11,"$#,##0.00")&" from your cushion. That\'s what it\'s for.",'
          '"RED: Your cushion can\'t cover this week. Pay bills first and spend only "&TEXT(C10,"$#,##0.00")&".")))')
c = cell(s3, "B16", status, bold=True, size=13)
c.alignment = Alignment(wrap_text=True, vertical="center")
s3.row_dimensions[16].height = 48
s3.conditional_formatting.add("B16", FormulaRule(formula=['LEFT($B$16,5)="GREEN"'], fill=fill(GREEN)))
s3.conditional_formatting.add("B16", FormulaRule(formula=['LEFT($B$16,6)="YELLOW"'], fill=fill(YELLOW)))
s3.conditional_formatting.add("B16", FormulaRule(formula=['LEFT($B$16,3)="RED"'], fill=fill(RED)))
s3.conditional_formatting.add("C11", FormulaRule(formula=['AND(ISNUMBER($C$11),$C$11<0)'], fill=fill(YELLOW)))
s3.conditional_formatting.add("C11", FormulaRule(formula=['AND(ISNUMBER($C$11),$C$11>=0)'], fill=fill(GREEN)))
note(s3, "B18", "How it works: your safe weekly number covers bills, tax jar and a steady spending allowance. "
               "Good weeks fill the cushion, slow weeks take from it, so your spending stays the same every week.")
s3.merge_cells("B18:D18")
s3.row_dimensions[18].height = 30

# ---------- YEAR VIEW ----------
s4 = sheet("Year View", {"A": 3, "B": 8, "C": 14, "D": 16, "E": 14, "F": 15, "G": 15, "H": 18, "I": 16})
title(s4, "Year View", "Log every week here after payday. Your cushion balance updates by itself.")
header(s4, 5, ["Week", "Week starting", "Take-home pay", "Tax jar", "Bills set-aside", "Safe to spend",
               "Cushion + / -", "Cushion balance"])
s4.row_dimensions[5].height = 32
ex = [620, 380, 540, 290]
s4.add_data_validation(dv4 := DataValidation(type="decimal", operator="between", formula1="0", formula2="1000000",
                                             allow_blank=True, showErrorMessage=True, errorTitle="Numbers only",
                                             error="Type a dollar amount."))
for i in range(52):
    rr = 6 + i
    cell(s4, f"B{rr}", i + 1)
    cell(s4, f"C{rr}", None, fmt="mmm d")
    cell(s4, f"D{rr}", ex[i] if i < len(ex) else None, fmt=MONEY)
    cell(s4, f"E{rr}", f'=IF(D{rr}="","",D{rr}*{TAX})', fmt=MONEY, bg=CREAM)
    cell(s4, f"F{rr}", f'=IF(D{rr}="","",{BILLS_W})', fmt=MONEY, bg=CREAM)
    cell(s4, f"G{rr}", f'=IF(D{rr}="","",{ALLOW})', fmt=MONEY, bg=CREAM)
    cell(s4, f"H{rr}", f'=IF(D{rr}="","",D{rr}-E{rr}-F{rr}-G{rr})', fmt=MONEY, bg=CREAM)
    cell(s4, f"I{rr}", f'=IF(D{rr}="","",{START}+SUM(H$6:H{rr}))', fmt=MONEY, bg=CREAM)
dv4.add("D6:D57")
s4.conditional_formatting.add("H6:H57", FormulaRule(formula=['AND(ISNUMBER(H6),H6<0)'], fill=fill(YELLOW)))
s4.conditional_formatting.add("H6:H57", FormulaRule(formula=['AND(ISNUMBER(H6),H6>=0)'], fill=fill(GREEN)))
s4.conditional_formatting.add("I6:I57", FormulaRule(formula=['AND(ISNUMBER(I6),I6<0)'], fill=fill(RED)))
note(s4, "K6", "Example: 4 weeks filled in. Replace with yours.", TERRA, True)
s4.column_dimensions["K"].width = 30
chart = LineChart()
chart.title = "Pay vs your safe number"
chart.height, chart.width = 7.5, 16
chart.y_axis.title = "$"
chart.x_axis.title = "Week"
chart.add_data(Reference(s4, min_col=4, min_row=5, max_row=57), titles_from_data=True)
chart.set_categories(Reference(s4, min_col=2, min_row=6, max_row=57))
s4.add_chart(chart, "K9")

# ---------- CUSHION (BUFFER) TRACKER ----------
s5 = sheet("Cushion", {"A": 3, "B": 40, "C": 18, "D": 56})
title(s5, "Cushion Tracker", "Your money for slow weeks, and how many slow weeks it covers.")
items = [
    (5, "Cushion balance now", f"={START}+SUM('Year View'!H6:H57)", MONEY, GREEN, "Starting cushion plus every week you logged."),
    (6, "Weeks of bills it covers", f'=IF({BILLS_W}=0,"",C5/{BILLS_W})', "0.0", WHITE, "If you earned nothing at all, bills would be covered this many weeks."),
    (7, "Gap in your worst week", f'=IF(COUNT({INC})=0,"",MAX(0,{BILLS_W}+{ALLOW}-MIN({INC})*(1-{TAX})))', MONEY, WHITE,
     "How much your lowest week falls short of bills + spending allowance."),
    (8, "Worst weeks it covers in a row", '=IF(C7="","",IF(C7=0,"Every week is covered",C5/C7))', "0.0", WHITE,
     "How many of your worst weeks in a row the cushion can absorb."),
    (10, "Cushion goal (4 weeks of bills + spending)", f"=4*({BILLS_W}+{ALLOW})", MONEY, WHITE, "A good first goal. Raise it once you get there."),
    (11, "Progress to goal", '=IF(C10=0,"",MIN(1,MAX(0,C5/C10)))', "0%", WHITE, ""),
]
for rr, label, f, fmt, bg, n in items:
    cell(s5, f"B{rr}", label, bold=True)
    cell(s5, f"C{rr}", f, fmt=fmt, bg=bg, bold=rr == 5, size=13 if rr == 5 else 11)
    note(s5, f"D{rr}", n)
s5.conditional_formatting.add("C5", FormulaRule(formula=['C5<0'], fill=fill(RED)))
s5.conditional_formatting.add("C11", FormulaRule(formula=['AND(ISNUMBER(C11),C11>=1)'], fill=fill(GREEN)))
s5.conditional_formatting.add("C11", FormulaRule(formula=['AND(ISNUMBER(C11),C11<1)'], fill=fill(YELLOW)))

# ---------- RENT WEEK PLAN ----------
s6 = sheet("Rent Week Plan", {"A": 3, "B": 44, "C": 18, "D": 50})
title(s6, "Rent Week Plan", "Split rent across every payday so rent week is just another week.")
plan = [
    (5, "Rent amount", "=Bills!C6", MONEY, "From the first line of Bills Calendar. Type over it if different."),
    (6, "Paydays left before rent is due", 4, "0", "Count your paydays between today and the due date."),
    (7, "Already set aside for rent", 300, MONEY, "Example: $300. What's already in your rent envelope."),
    (8, "Still needed", "=MAX(0,C5-C7)", MONEY, ""),
    (9, "Set aside each payday until rent", '=IF(C6<=0,C8,C8/C6)', MONEY, "Move this every payday, before anything else."),
]
for rr, label, v, fmt, n in plan:
    cell(s6, f"B{rr}", label, bold=rr in (8, 9))
    cell(s6, f"C{rr}", v, fmt=fmt, bg=GREEN if rr == 9 else WHITE, bold=rr == 9, size=13 if rr == 9 else 11)
    note(s6, f"D{rr}", n)
s6["B12"] = "If rent week is tight"
s6["B12"].font = Font(bold=True, size=13, color=TERRA)
tips = [
    "Pay rent first, the moment you have it. Everything else waits.",
    "Look at Bills Calendar: can any bill move its due date to after rent? Many companies let you choose.",
    "Pause one subscription this month. You can turn it back on later.",
    "Use your cushion for the gap. That's what it's for, no guilt.",
    "Pick up one extra shift only if you need to, and send all of it to rent.",
    "Next month, start the rent slices one payday earlier.",
]
for i, t in enumerate(tips):
    cell(s6, f"B{13 + i}", "☐  " + t)
    s6.merge_cells(f"B{13 + i}:D{13 + i}")

wb.active = 0
wb.save(out)
print("saved", out)
