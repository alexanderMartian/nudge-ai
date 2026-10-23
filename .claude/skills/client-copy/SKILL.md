---
name: client-copy
description: Rules for writing or polishing English website copy for client landings (headlines, CTAs, sections, FAQ) and explaining it in Ukrainian. Use when the user asks to write, rewrite or check site texts, or runs /client-copy.
---

# Client copy

## Before writing
Use the brief from `CLAUDE.md` / the user: business, audience, main goal, tone (formal / friendly / premium), US or UK spelling. If the audience or goal is unknown, ask once.

## Rules
- Plain, specific, benefit-first. Say what the client gets, for whom, and what to do next.
- Headline ≤ 10 words. Subheadline: one sentence ≤ 25 words. Paragraphs ≤ 3 short sentences.
- CTA = verb + outcome: "Book a free consultation", "Get a quote in 24 hours" — not "Submit", "Learn more".
- One main CTA repeated (hero, middle, end); secondary CTAs visually weaker.
- Use the client's real facts only. NEVER invent numbers, testimonials, reviews, client names, awards or guarantees. If something would help, add `[PLACEHOLDER: e.g. years in business]` and tell the user what to ask the client for.
- Avoid AI clichés: unlock, elevate, seamless, cutting-edge, revolutionize, game-changer, empower, delve, "in today's fast-paced world", "look no further", "take your X to the next level", em-dash overuse.
- Consistent spelling (US or UK) and terminology across the page. Active voice. Second person ("you").
- FAQ: real objections (price, timing, process, guarantees the client actually gives), answers ≤ 3 sentences.
- Microcopy: form labels, placeholders, success and error messages, button loading states.

## Output
1. For headlines and CTAs give 3 variants, mark the recommended one.
2. Write final texts into `content/site.ts` (keep the existing shape; don't touch components).
3. After the English text, give Oleksandr a short Ukrainian explanation in the chat (not in the file): what each block says and why, plus any `[PLACEHOLDER]` questions to send the client.
