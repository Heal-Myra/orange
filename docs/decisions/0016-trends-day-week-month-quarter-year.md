# 0016 · Trends: Day, Week, Month, Quarter, Year

Date: 22 Oct 2026 · Decided by: founder ("we should be able to select all time frames … as in Apple Health, which gives a good trend overview to gauge directional movement")

## Decision
A D · W · M · Q · Y switch at the top of Today, Body, Mind and Soul (Quarter instead of Apple's 6M, as the founder asked).
D keeps the day's cards with the day arrows. W, M, Q and Y replace them with trend cards for that tab, and everything shown
covers the chosen period; arrows step back to earlier periods. The choice is shared across tabs.

Each card: the period's average (or number of days, for yes/no habits), the change against the previous period, and a bar
chart (day bars for W and M, week bars for Q, month bars for Y) with the daily target as a dashed line where there is one.
Days with nothing recorded are left out, so a missed entry never looks like a bad day. Calculations: src/lib/trends.ts (tested).
