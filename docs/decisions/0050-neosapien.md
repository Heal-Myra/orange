# 0050 · NeoSapien (Neo 1) in Happy Orange

Date: 6 Nov 2026 · Founder: "Go" on the preview (Today card, yes/no review, journal filled but editable); "make it
possible without someone having a Claude account".

- **Connection:** Profile › NeoSapien (Neo 1) › Connect. Happy Orange's own server (`supabase/functions/neosapien`)
  signs in to NeoSapien's MCP server (`https://api.neosapien.xyz/mcp`) with the standard MCP sign-in (OAuth 2.1, PKCE,
  dynamic client registration). Sign-ins are kept only on the server (tables in migration 0008, no app access). No
  Claude, ChatGPT or other AI account is needed.
- **What is read:** the day's conversations (title, short summary, emotions, people, times), NeoSapien's end-of-day
  summary and reminders. Myra turns them into short lines: up to 3 thank-yous, a laugh, a kindness, the best part,
  up to 5 to-dos that are the person's own, and one sentence on the tone of the day.
- **What is kept:** only those short lines and counts (talk minutes, work minutes, tense/calm conversations, tense after
  4 pm), cached 30 minutes per day. Never transcripts, money figures, deal terms or summaries.
- **Nothing without a yes:** Today shows "From your day" (yesterday before 11 am if not reviewed); Review has ✓/✕ per
  line; the Gratitude journal shows green suggestions under empty boxes with Keep/✕. A filled box is never replaced.
- **Tone of the day** goes to Myra's context only; it earns no points.
- Disconnect in Profile deletes the sign-in and cached days.
