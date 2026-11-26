---
name: review-adr
description: Review an Assurance ADR against the team's review checklist (repetition, accuracy, risks, other teams, cross-checks, versioning, outputs), report findings, then apply agreed fixes and rebuild the PDF. Use when asked to review, check or tidy up an ADR before it goes to GIO, another team, finance or the SDA.
argument-hint: <ADR number, e.g. 11>
---

# Review an Assurance ADR

The checklist is the single source for what to check: `REVIEW-CHECKLIST.md`, in this skill's folder (`.claude/skills/review-adr/`).
Read it first, every time. Do not work from memory of earlier versions of it.

## Steps

1. **Find the ADR.** Treat `$ARGUMENTS` as the ADR number. Find `technology/quality-assurance-view/decision-records/assurance-adrs/00NN-*.md`. If no number was given, ask which ADR.
2. **Read the whole ADR**, and the related ADRs and caveat files it cites, enough to check consistency.
3. **Work through checklist sections 1 to 5** (Repetition, Accuracy and Consistency, Risks, Other Teams, Cross-Checks). For repetition, count each repeated fact and list where it appears, as a table if there are several. Check internal anchor links against the actual headings.
4. **Report findings before editing.** Group them by checklist section, most significant first. Give a concrete suggested rewrite for anything confusing. Ask the user whether to apply all of them, some of them, or none.
5. **Apply the agreed fixes.** Keep the ADR's existing style: plain British English, short sentences, bold for key figures, links in the form `[Heading](#anchor)`.
6. **Versioning (section 6).** Ask whether the current version has been sent to anyone. Only bump the version and add a revision entry if it has. Otherwise leave the version and the revision note alone.
7. **Outputs (section 7).**
   - Rebuild the PDF with `npm run build:assurance-adr -- <n>`.
   - Check the version and date in the PDF text. On macOS, extract the text with PDFKit through a small Swift script in the scratchpad if `pdftotext` is not installed.
   - Tell the user which slides to check by eye for overflow, especially any that had text added. You cannot see the rendered pages.
   - Publish to Confluence only when the user asks. If the restriction step fails, check the page's current restrictions read-only and report what you find before changing anything.
   - Do not commit unless asked.
8. **Summarise** what changed, what was left as it was and why, and anything the user still needs to check or decide.
