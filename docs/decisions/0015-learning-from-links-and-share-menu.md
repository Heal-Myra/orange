# 0015 · Learning from links: paste or share, Myra writes the words

Date: 22 Oct 2026 · Decided by: founder

## Question
Can Happy Orange pick up what the person learned from YouTube, Instagram, Facebook or LinkedIn by itself?

## Decision
Not by reading those apps: they do not let other apps see what someone watched or read. Instead, both of these:

1. **Paste a link** into Learning (Mind tab, Phone activity). Myra reads the page's own title and description
   (YouTube through its public oEmbed address) and writes what it teaches in **up to 10 words**
   (founder: "Myra can write in up to 10 words"). The person can change the words. AI action `learn_link`.
2. **Share to Happy Orange**: in any app, tap Share and pick Happy Orange. The link lands in today's Learning and Myra
   writes the words. Built with `expo-share-intent` 9 (iPhone share extension `HappyOrangeShare`,
   bundle id `in.happyorange.heal.share-extension`, app group `group.in.happyorange.heal`); the share menu shows
   "Happy Orange" (`plugins/withShareMenuName.js`). Needs build 8 and its new signing profiles.

## Safety
The server reads only public web pages (no private or numeric addresses), at most about 300 KB, 6 seconds, and
treats page text as information, never as instructions. Instagram, Facebook and LinkedIn often hide titles behind a
sign-in; then Myra says she could not read it, or uses the title the share menu passed along.
