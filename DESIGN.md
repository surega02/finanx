---
name: Finanx
description: Personal money ledger — the stamped register.
colors:
  paper: "#f2f1ec"
  paper-raised: "#f7f6f2"
  paper-deep: "#e9e7df"
  tan: "#e8e4da"
  cream: "#f7f3e8"
  ink: "#191918"
  ink-soft: "#55534a"
  ink-faint: "#7d7a6e"
  rule: "#b9b6a9"
  rule-soft: "#d3d0c4"
  slate: "#4a5b6b"
  slate-soft: "#6d7b87"
  stamp: "#c22f1d"
  stamp-deep: "#9d2415"
typography:
  display:
    fontFamily: "IBM Plex Mono, ui-monospace, Menlo, monospace"
    fontSize: "30px"
    fontWeight: 700
    letterSpacing: "0.24em"
  headline:
    fontFamily: "IBM Plex Mono, ui-monospace, Menlo, monospace"
    fontSize: "24px"
    fontWeight: 600
    letterSpacing: "0.02em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.16em"
rounded:
  radius: "2px"
  radius-tight: "1px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.stamp}"
    textColor: "{colors.cream}"
    typography: "{typography.label}"
    rounded: "{rounded.radius}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.stamp-deep}"
  button-primary-active:
    backgroundColor: "{colors.stamp-deep}"
  button-ghost:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.radius}"
    padding: "10px 16px"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.radius}"
    padding: "10px 16px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "10px 2px"
  fab-pad:
    backgroundColor: "{colors.stamp}"
    textColor: "{colors.cream}"
    rounded: "{rounded.radius-tight}"
---

# Design System: Finanx

## Overview

**Creative North Star: "The Stamped Register"**

Money is a register you stamp, not a dashboard you watch. Finanx presents every month as one ruled page of warm register paper under a hairline blue-gray ruling, where income and expense are a single counterforce pair and the saldo is the frontmost figure. Recording a transaction is the physical press of a hand stamp: the red FAB is a stamp with a handle, saving is the thump of a LUNAS/TERIMA stamp, and the act lands in a ledger row that trusts the numbers are exact.

The system refuses the white-card finance template. Nothing floats on the page — every ledger block is transparent so the surface's ruling passes underneath; sections separate on 1px rules and 2px ink double rules; and the balance is double-underlined in ink. Depth is the register's own material — paper, ink, and rules — never a card shadow.

Density is calm but exact. Inter carries the readable UI; IBM Plex Mono in tabular figures carries every amount and every chrome label. Stamp red is one saturated voice reserved for action and confirmation, while ink black and slate blue-gray are the two inks of the ledger itself.

**Key Characteristics:**
- Warm register-paper ground with a hairline blue-gray ruling — one ruled page, not cards.
- No floating surfaces; separation via 1px rules, 2px double rules, and a double-underlined saldo.
- Two ledger inks: ink for text and income, slate for expense and icons.
- One stamp red, reserved for action, confirmation stamps, focus, and the primary CTA.
- IBM Plex Mono (tabular) carries every amount and label; Inter carries prose and names.
- The hand-stamp FAB is the signature recording gesture.
- Mobile bottom tab bar, desktop sidebar, single 900px breakpoint.

## Colors

A warm paper-and-ink ledger with one saturated stamp red reserved for action and confirmation, and a blue-gray secondary ink.

### Primary
- **Stamp Red** (#c22f1d): the world's one saturated voice. Used only for action, confirmation, and focus — the FAB pad, primary buttons, LUNAS/TERIMA confirmation stamps, the active nav marker, the text caret, text selection, and the focus ring. Never for figures or bulk content.
- **Stamp Red Deep** (#9d2415): the pressed state of the stamp. Hover/press on primary buttons and the FAB, plus destructive roles — delete icon buttons and inline error text.

### Secondary
- **Slate** (#4a5b6b): the expense pole of the ledger. Expense figures, expense bars in the counterforce and breakdown, expense stamps, category icons, and the profile photo ground.
- **Slate Soft** (#6d7b87): icons at rest and hovered icon accents.

### Neutral
- **Register Paper** (#f2f1ec): the page ground and body background; the login panel.
- **Paper Raised** (#f7f6f2): slightly-lighter surfaces that sit on the paper — inputs, selects, control buttons, the sheet body, the sidebar.
- **Paper Deep** (#e9e7df): hover fills for controls and nav; the scrollbar track.
- **Tan** (#e8e4da): plate and sheet heads, the saldo cell, the profile photo ground, the scrollbar thumb.
- **Cream** (#f7f3e8): ink-on-stamp text; the login cover plate.
- **Ink** (#191918): primary text, income figures, active nav, ink buttons, the FINANX mark, the profile band, and 2px section rules.
- **Ink Soft** (#55534a): secondary text — nav labels, field labels, summary sub-labels.
- **Ink Faint** (#7d7a6e): tertiary text — meta, placeholders, tick labels, mark subtitle, pagination.
- **Rule** (#b9b6a9): hairline borders and dividers.
- **Rule Soft** (#d3d0c4): finer hairlines — inner row dividers and subtle borders.

### Named Rules
**The Stamp Red Rule.** Stamp red appears only for action, confirmation, and focus — the FAB, the primary CTA, confirmation stamps, active nav, selection, and the caret. Figures, body text, and bulk content never wear red; expense stays slate and income stays ink. Its rarity is the point.

**The Two-Ink Rule.** Money signs have exactly two colors: ink for income, slate for expense. No other color signals which way a figure runs.

## Typography

**Display Font:** IBM Plex Mono (with ui-monospace, Menlo fallback)
**Body Font:** Inter (with system-ui fallback)
**Label/Mono Font:** IBM Plex Mono — the ledger voice

**Character:** The register is typeset like a book-keeping log: IBM Plex Mono in tabular figures carries every amount and every chrome label, uppercase with wide tracking, while Inter carries the readable, human prose — names, descriptions, empty-state copy. The pairing reads as a machine-stamped book with calm human annotations.

### Hierarchy
- **Display** (IBM Plex Mono 700, 30px, 0.24em): the FINANX cover mark and the F-in-the-round stamp on the login cover. Found only on the cover.
- **Headline** (IBM Plex Mono 600, 24px, 0.02em): page titles; the month label sits at 22px in the same role.
- **Ledger figures** (IBM Plex Mono 600, tabular-nums): the numbers that must align — summary values 22px, the saldo 26px, row amounts 13px, counterforce values 13px.
- **Title** (Inter 600, 20px): the profile name.
- **Body** (Inter 400, 16px, 1.5): UI prose, notes, names, empty states; the text tier drops to 13–13.5px for names and notes.
- **Label** (IBM Plex Mono 600, 11px, 0.16em, uppercase): the chrome voice — field labels, section heads, plate titles, nav, buttons. Labels range 9–13px with tracking 0.08–0.18em.

### Named Rules
**The Tabular Figure Rule.** Every amount renders in IBM Plex Mono with `font-variant-numeric: tabular-nums` (and `tnum`), so columns of figures align to the digit. No proportional figures anywhere in a money context.

**The Chrome-in-Mono Rule.** All chrome — labels, section heads, buttons, nav, marks, tick labels — is uppercase IBM Plex Mono with letterspacing. Inter appears only for readable prose and names. If a page-heading text runs in mono, it is ledger furniture, not content.

## Layout

The app is a two-column shell on desktop: a 248px sticky sidebar (paper-raised, rule border) beside a 1fr main column that centers content to a max of 880px. Below 900px the app collapses to one column: the sidebar hides, a sticky top bar carries the mark, and a fixed 64px bottom tab bar (paper-raised, rule top border) takes navigation; the FAB floats above the tab bar. Page padding drops from 40px sides / 96px bottom (desktop) to 24px / 20px / 132px-bottom (mobile).

The register page is one ruled sheet: the surface layer paints a hairline blue-gray ruling (a repeating-linear-gradient of slate at 5% opacity on a 28px pitch) that passes under every transparent ledger block. Sections — the summary plate, counterforce, breakdowns, transaction list, category groups, profile card, plates — are 1px-rule-bordered transparent panels spaced 24px apart, with 1px rule-soft row dividers inside. Section heads and the month head close with a 2px ink rule; the saldo is double-underlined. The spacing rhythm is 8/16/24, with interior block padding 12–18px.

### Named Rules
**The One-Page Rule.** Nothing floats on the register page. Every section is a transparent block that lets the ruling pass through; surfaces never gain a raised background or a shadow on the page itself. If you need separation, use a rule.

## Elevation & Depth

The system is flat paper — no ambient shadows on the register page, no floating cards, no lift. Depth is conveyed two ways: the paper's ruling (the page's texture underneath transparent blocks) and ink rules (definition between sections). Shadows exist in only two deliberate places: the hard "press edge" under stamping instruments, and soft ambient shadows on overlay chrome (the sheet and the toast).

### Shadow Vocabulary
- **The press edge** (hard 2–3px bottom offset in a deeper color): the stamping instruments carry a hard edge — the FAB pad (`0 3px 0 #9d2415` plus a red-tinted bloom `0 8px 20px -6px rgba(157,36,21,0.5)`), primary buttons (`0 2px 0 #9d2415`), ink buttons (`0 2px 0 #0c0c0a`), the Google button (`0 2px 0` of the rule). It reads as the ink block's own pressed edge.
- **Sheet** (`box-shadow: 0 -2px 24px -6px rgba(28,27,23,0.22)`): upward ambient shadow on the bottom sheet.
- **Toast** (`box-shadow: 0 1px 2px rgba(28,27,23,0.06), 0 8px 24px -8px rgba(28,27,23,0.14)`): soft ambient under the floating toast.

### Named Rules
**The Press Rule.** The register page is flat at rest. Hard offset shadows appear only beneath the stamping instruments — the FAB pad and the primary/ink buttons — as the ink block's own edge. Overlays may carry soft ambient shadows; the paper itself never lifts.

## Shapes

The form language is hairline-crisp and mechanical. Standard corners are 2px and the tightest forms 1px; nothing rounds beyond a 2px suggestion. Icon chips and category glyph squares are square (1px corners) with 1px rule borders; roundness is reserved for the circular forms that are literal in the world — stamps and avatars render as 50% circles. Borders are ink hairlines: 1px rule for panels and dividers, 2px ink for section-close rules, 2px stamp for confirmation stamps, 1px dashed rule for empty states, and a 3px double-ink underline under the saldo. The stamp silhouette recurs everywhere: the hand-stamp FAB (handle + pad), rotated confirmation stamps (rotate(-2deg), double border, inner sheen), and round stamp marks.

### Named Rules
**The Double Rule Rule.** A 2px ink rule closes every section head and the month head, and the balance sits under a 3px double ink underline. In a system of 1px hairlines, the doubled ink rule is the register's strongest emphasis — use it only to close a ledger head or seal the balance.

## Components

### Buttons
- **Shape:** 2px corners; uppercase IBM Plex Mono 12px, 0.1em tracking, weight 600; padding 10px 16px (small variant 6px 10px at 11px).
- **Primary:** stamp red fill, cream text, `0 2px 0` stamp-deep press edge. Hover deepens to stamp-deep; active presses down 1px with a 1px edge.
- **Ghost:** paper-raised fill, ink text, 1px rule border; hover warms to paper-deep with a slate-soft border.
- **Ink:** ink fill, paper text, `0 2px 0 #0c0c0a` press edge; hover deepens to near-black.
- **Danger (outline):** transparent fill, stamp-deep text and border; hover lifts an 8% stamp-deep wash.
- **Icon buttons (chip):** 30px square, 1px corners, transparent; hover shows a rule border on paper; the destructive variant hovers to stamp-deep with a red wash.
- **Disabled:** never fully gray — 40% opacity with a struck-through hairline (`::after`, currentColor). Disabled means crossed out, not faded out.
- **Focus:** global 2px stamp-red outline, 2px offset, 2px corners.

### The Stamp FAB (signature)
The hand stamp is the world's recording gesture. A 44×9px ink handle sits atop a 72×58px stamp-red pad with the plus glyph; the pad casts the red press edge, hovers up 1px, and presses down 2px on active. It sits fixed at bottom-right (36px on desktop, above the tab bar on mobile) with a small mono uppercase label chip in a paper-raised frame on desktop, hidden on mobile. Pressing it opens the transaction sheet — pressing is stamping.

### The Confirmation Stamp
Saving a transaction thumps a rotated confirmation stamp into place: LUNAS (paid — slate, expense) or TERIMA (received — stamp red, income). 2px double border with an inner hairline and a soft radial sheen, rotated -2deg, animated in with a scale-overshoot (`stamp-in`). Expense rows carry a small LUNAS chip beside the category name.

### The Sheet
A raised register page: paper-raised body, 1px rule frame, tan head with the mono uppercase title, 1px rule divider, max-width 520px (full-bleed and bottom-anchored below 900px), upward ambient shadow, and a `sheet-in` rise. Dismissed by the corner chip, a backdrop click, or Escape. Forms inside use underline inputs and the field-label voice.

### Inputs / Fields
- **Style:** underline fields — transparent fill, 1px rule bottom border, 15px Inter text; the amount field is 22px mono 600 with tabular figures; placeholders in ink-faint.
- **Focus:** the bottom border thickens to 2px stamp red; the caret is stamp red.
- **Error / Disabled:** inline error text in stamp-deep mono 11px; required fields marked with `*`; disabled controls struck through.

### Navigation
- **Sidebar (desktop):** paper-raised column with 14px Inter 500 items in ink-soft and slate icons; hover fills paper-deep; the active item is ink 600 with a stamp-red icon and a 4px stamp-red dot on the rail. The FINANX mark (mono 600, 0.22em) heads it under a rule-soft divider, with the ID/EN language toggle at the foot.
- **Bottom tabs (mobile):** four mono 10px uppercase tabs (0.1em) in ink-faint with icons; the active tab is ink with a stamp-red icon and a 28×3px stamp-red bar across its top.

### Ledger Rows
A transaction row is a 4-column grid — date (mono 12px, ink-soft); main (a 32px square icon chip in a rule border plus category name at Inter 13.5 and a note at Inter 12 ink-faint); amount (mono 600 13px tabular — ink for income, slate for expense); actions (edit/delete chips that fade in on hover). Rows divide on 1px rule-soft hairlines and hover tints the row with a 5% slate wash. Headers are mono 10px uppercase at 0.14em.

### The Summary Plate
Three cells — income (ink), expense (slate), saldo — in one rule-bordered grid split by 1px rules, 22px mono figures (saldo 26px) under mono uppercase labels. The saldo cell is tan and its figure carries the 3px double ink underline. On mobile the columns fold to stacked rows with rule separators.

### The Counterforce
Income versus expense on a single shared scale: two 26px tracks on a labeled graticule (0 / half / max in compact mono ticks), bars driven by `transform: scaleX` for GPU-friendly animation — income in ink, expense in slate. The max is shared across the ledger so both bars read against the same measure; breakdown bars use the same scaleX treatment.

## Do's and Don'ts

### Do:
- **Do** render every amount in IBM Plex Mono with tabular-nums so columns of figures align to the digit.
- **Do** keep ledger blocks transparent — the paper's ruling (28px pitch, slate at 5%) must pass under every section.
- **Do** separate sections with 1px rules, close section heads with the 2px ink double rule, and double-underline the saldo.
- **Do** reserve stamp red for action, confirmation, and focus — the FAB, the primary CTA, stamps, active nav, the caret, and selection.
- **Do** set income figures in ink and expense figures in slate, everywhere.
- **Do** strike disabled controls through at 40% opacity instead of fading them out.
- **Do** keep corners at 1–2px and reserve circles for things that are literally stamps or avatars.

### Don't:
- **Don't** float cards — no raised white panels, no lifted surfaces, no shadows on the register page.
- **Don't** colorize figures red or green; the ledger has exactly two inks for money signs.
- **Don't** use stamp red for bulk data, body copy, or decorative accents — rarity is its meaning.
- **Don't** typeset amounts in proportional figures or in Inter; every figure is mono and tabular.
- **Don't** introduce new hues; the palette is paper, ink, slate, and stamp red.
- **Don't** compete with the ruling — no busy backgrounds, gradients, or texture over the ledger blocks.
