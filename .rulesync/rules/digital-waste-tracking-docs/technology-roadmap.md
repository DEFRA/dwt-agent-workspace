---
root: false
targets:
  - '*'
description: >-
  digital-waste-tracking-docs technology roadmap. Edit roadmap.yaml. Leave
  generated regions alone.
globs:
  - 'repos/digital-waste-tracking-docs/technology/roadmap/**'
cursor:
  alwaysApply: false
  description: >-
    digital-waste-tracking-docs technology roadmap. Edit roadmap.yaml. Leave
    generated regions alone.
---
# Technology Roadmap, editing rules

This folder is generated from one file. Read this before touching anything in it.

## Source of truth

`roadmap.yaml` drives every chart and table on every page in this folder. Edit the YAML, never the text between `<!-- roadmap:<name>:start -->` and `<!-- roadmap:<name>:end -->`. Hand-written prose lives outside the markers. A page opts out of a region by not carrying its markers, and a region with only one of its two markers fails the check.

```
npm run roadmap:generate      # rewrite every generated region
npm run roadmap:check         # CI gate, fails when a page is stale
npm run test:roadmap          # schema rules and golden snapshots in test/fixtures/roadmap
```

The generator is `scripts/generate-roadmap.js` with renderers under `scripts/lib/roadmap/`. Boxes in a Mermaid diagram have rounded corners, `id("text")` and never `id[text]`, and subgraph frames are rounded through the shared init line. Chart colours live in `theme.js` and target id suffixes, never hand-edit the Mermaid init line.

## Pages and names

- The roadmap is read through four views, and the owner and lane pages sit beneath them. Every page says where it sits.
  - `README.md` is the hub and the front door. It opens with the Timeline, every lane on one chart, which sits front and centre on this page and nowhere else. Then the view map, what enables what, what stands out, the legend and the open questions, and nothing else. The introduction says once that every chart and table is generated from one file and none is drawn by hand. Keep that sentence. Keep it short. A new chart or table goes on a view page, `owners.md` or `how-to-read.md`.
  - One page per view, chosen by each view's `page:` field, `architecture.md`, `software.md`, `data.md` and `platform.md`. A view page holds the view's quarter grid, what its items need, its items and the short table of the rows we wait on for them. `architecture.md` also holds Changes by Component. Each view page opens, straight after the you-are-here box, with a `:box:info:What this view is for:...:` box of one to three short sentences. The Introduction beneath it holds only the links onward and does not repeat the box.
  - `owners.md`, What We Wait On, is the way in to the pages arranged by team. It holds the page map, the feeds diagram and the external roadmaps.
  - One folder per team, `dwt/`, `gio/`, `cdp/`, `reg/`, `wce/`, `diwass/`, each with a `README.md` overview page. An overview page indexes the team's lane pages. It draws the lanes on one chart only where the team has two or more, which today is DWT and WCE.
  - One page per lane, chosen by each lane's `page:` field. The lane page holds the rows, the detail, the ownership table and the sources.
- This is the technology roadmap. The product roadmap on the DWT roadmaps board (`external_roadmaps` id `product`) decides what we deliver for users and when. Never add a product-owned item to a view, such as a mandation date, a feature, an API publication date or a charge going live. It is a product milestone, an outcome with `product: true` and an M id on a stream lane, defined once in the Product and Service Milestones table on the Programme Calendar. A technology item says what it is for in the Supports column, from the milestones that `needs` it and its `supports` card.
- A roadmap item is defined once, in the `## Items` table of its view page. Every other mention is a link to that table, which the generator writes for ids in generated regions and `{R26}` tokens. In hand-written prose link the id yourself, `[R26](./software.md#items)`. Never add a second table of items. Keep the `## Items` heading as it is, the links target it.
- A view page never repeats a row's trigger, window detail, fallback, route or ownership. Its short table links each row to the lane page that holds them.
- Architecture items enable software items and the streams pull software items. Say it that way round.
- The Platform view lists only what we need from CDP and what is ours to do on the platform. Infrastructure, DevOps and internal IT stay on the CDP roadmap, which the page links.
- Two side pages sit beside the views and are listed in `meta.pages`. `programme-calendar.md` holds the streams and Policy. `owners.md` is marked `owners: true` and lists the external roadmaps. There is no How to Read page. The legend, which is the evidence grades and the colour key and nothing else, is the second-to-last section of the hub, named in `meta.legend`, and every other page's breadcrumb links to it. Do not add a section on how the pages fit together or a Scope section.
- Every page except the hub opens with the generated `you-are-here` region, which names the hub, then What We Wait On and the team for a team or lane page, then the page, and links to the legend. Do not hand-write a "part of the roadmap" box.
- A chart on a team or lane page opens with one sentence linking the combined chart, "This lane's bars from the combined chart."
- Team and lane pages carry `<!-- Parent: What We Wait On -->` after the Technology Roadmap parent line. View pages sit directly under the hub.
- Confluence titles come from `Title:` markers. Team pages are `DWT Roadmap` and `Needs from <Team> Roadmap`. Lane pages are `<Team> <Kind> for DWT`, except DWT's own, `DWT Applications` and `DWT Data`.
- A lane's YAML `title`, its page H1, its `Title:` marker and its sidebar label in `astro/astro.config.mjs` are the same words. Change all four together. File names stay as they are. A view's YAML `title`, its page H1 and its sidebar label follow the same rule.
- The sidebar lists the hub, the four views in YAML order and the Programme Calendar, then one collapsed `What We Wait On` group. Inside it a team's group is named after the team and its first entry is `<Team> Overview`, such as `GIO Overview`, never a bare `Overview`. The groups follow the order of the page map, which is the order the lanes appear in the YAML.
- A board, page, brief, discovery or ADR does not ask, say, show, record, recommend or propose. Write where the thing is, "The same question is on the product board", "In the discovery, we send them", or who did it when it was us, "In DWT ADR 6 we propose". Do not attribute it to another team.
- In Open Questions sections only, write RoW, CoW and GLW. Everywhere else use the full workstream names.
- The roadmap is internal. The regulators do not see it, so nothing is written for them.
- Do not explain how to read a table row. There is no "Reading the Rows" section, and the column headings do that work.
- Collection of Waste and Green List Waste are assumed to come under the Receipt of Waste stage gates, same budget, so no stage gate diamonds are drawn for them. GDS assessments are still drawn. The gates sit on the National Waste lane.
- Say which team, never "owner". "We know which team is taking it on", "the team that provides it", "the platform team takes it over". Not "names an owner", "ownership moves" or "the owning team". "We own" and "our own" are fine. The YAML keys `owners` and `ownership` stay, they are never printed.
- Do not draw dated bars for stages nobody has planned. A row with no plan sits under Unscheduled.
- The two calendar lanes are National Waste (CoW + RoW) and International Waste (GLW), and a lane of `kind: stream` means one of them. Receipt of Waste, Collection of Waste and Green List Waste are the product workstreams inside them and keep their names on phases, milestones and labels. In prose a stream is any of our four delivery teams, as DWT ADR 1 and DWT ADR 2 say, so "the streams" means the teams and "the stream lanes" means the two lanes. Never count the streams or call them services. The four delivery teams are Software Providers and Insights (Team A), Waste Operator Enablement (Team B), National Waste and International Waste, named that way and never the GLW Team or the CoW team. The Enablement team and the Cross-Cutting team sit beside them and own no lane.
- The acronym is WCE, never W&CE. "Technology" covers data too, so the non-data half is "Applications".
- YAML `lanes` order is display order on every chart and grid. Calendar lanes come first.

## Schema in one screen

- `meta`. `title`, `actor`, `horizon`, `grid_from`, `guides`, `gates` (an entry with `assessment: true` is drawn but kept out of the gate table), `owners` (folder id, title and `summary`), `pages` (the side pages, each with `page`, `title`, `summary`, `legend: true` on the one that explains the colours and `owners: true` on the owners index), `external_roadmaps`.
- `lanes`. `id`, `title`, `kind` (stream, assurance, software, dependency), `page`, `summary` (one plain sentence of at most 140 characters, printed on the page map and the team page), optional `feeds` (the lane this one feeds, drawn as an arrow), `external_roadmaps`, `heading`, `intro`.
- `views`. `id`, `title`, `page`, `rows` (component, stream or lane, what the rows of the view's quarter grid are), `summary`, optional `external_roadmaps`. List order is display order. View ids have their own id space.
- `components`. The rows of the hub's Changes by Component grid and of a view laid out by component.
- `evidence_sources`. YAML anchors shared by bars. `ref` is the tag printed on the chart, 28 characters at most.
- `items`. Kinds `outcome` and `dependency` are register rows. Kinds `phase`, `event`, `extraction`, `live`, `milestone`, `window`, `decision`, `fallback`, `gate`, `handover` are bars. Fields that link them are `for`, `fallback_of`, `after`, `realises`, `related`. Every outcome and dependency row names its `view`, except a product milestone, which carries `product: true`. `needs` may run from a product milestone to a technology item, never the other way. `supports` names, in words, the product roadmap card a technology outcome sits under. A bar never does, it takes the view of the row it serves. An outcome lists the outcomes it cannot land without in `needs`, which must not loop, and the check warns when a needed item is placed later than the item that needs it or has no quarter. `streams` names the streams a row serves when its lane is not a stream, and a row in a view laid out by stream must serve at least one. `jira` becomes a link. `ownership` feeds the ownership table. `quarter` overrides placement.
- Row id prefixes name the side DWT waits on. WCE, GIO, CDP, REG, DIWASS, POL. DWT rows run the other way, capabilities DWT lifts into the shared platform. R numbers are technology roadmap items. M numbers are product milestones, and the check rejects an M id on anything else.
- Prose fields accept `{M3}` tokens, which expand to the item's label and ref as one link, `Report Waste Collected (M3)`. `{M3|our own words}` links those words and keeps the ref, for prose that already names the thing.

## Evidence rules

- The Sources tables are hidden for now, `meta.show_sources: false`, and each `## Sources` section is commented out on its page with its markers written as `[roadmap:evidence:start]`. The evidence stays in the YAML and still has to be kept. Do not delete the commented blocks.
- Every bar carries a grade. Observed is written in a published document the reader can open. Inferred follows from observed facts by a stated rule. Assumption is anything else.
- Cite documents if possible. A claim with no document is an assumption, "awaiting record".
- Programme dates, such as legislation, beta and mandate dates, are cited to the Service roadmap on the DWT roadmaps board, with the date we last saw it. The old programme roadmap board is a Q4 2025 roadmap and the "No regrets roadmap candidates" area is marked superseded. Cite neither.
- A "seen" date moves only after the content has been looked at again. For anything that is not markdown in a local checkout, ask for the content.
- Never cite the Solution Overview as the source for a date or a fact. It is itself still changing, and for these dates the roadmap is the source of truth. State the date plainly. Do not write "awaiting record" for it, we are not waiting on anything.
- Link the SADD by section with no version, `SADD section 6`.
- Never give a version number when citing an ADR. Write `Assurance ADR 6`, never `Assurance ADR 6 v1.1`.

## Prose rules

- One short plain sentence before every chart and table saying what it is, and nothing on how to read it. Never write "each row is", "each bar is", "this table shows", "the blocks beneath" or what a colour or shape means. The charts and tables carry their own headings and the legend covers the colours, so a sentence on how to read them adds nothing and gets in the way of the content. The colour key and the evidence grades in the hub's How to Read the Roadmap section are the only legend.
- In the row fields, assumes, window, fallback and route, and in lane intros, write as DWT in the first person, we and our. Tables, titles and sources name DWT.
- Name the quarter or month, `Q4 2026` or `September 2026`, never "this quarter", "now" or "today", which stop being true. Column headings such as "Provider today" and the chart's today line are the exception.
- The words that refer to a thing are the link to it. Never put a link or a token in brackets after the text, so write `{R8|local authorities get access}` and `[Manage Account ADR-007](...)`, never `local authorities get access ({R8})`.
- Three or more things are a list. Paragraphs stay under about 60 words. No filler.
- Links in YAML prose are written relative to this folder. The generator climbs out of owner folders for lane pages.
- Anchors are slug style, `#what-enables-what`. Never write Confluence-case anchors, the publisher folds slugs onto them.

## TODO boxes

A `:box:note:TODO:...:` box marks a gap on a page that we still have to close ourselves. The hub's "Early draft" warning is the umbrella, the boxes are the specifics, and `npm run roadmap:check` lists them by page.

- One or two short sentences in our own voice, saying what we still have to do and what closes it. "We still have to raise tickets for 20 of these 27 items and put the keys on their rows." Never "dates need checking".
- Only for our own work that changes the page. Something we wait on from another team is already an assumption marked "awaiting record", so a box for it would repeat the row.
- Placed under the section heading it concerns, outside any marker region, so the reader meets it next to the thing it is about.
- One box per section at most and a handful per page. A page that needs more is not ready, and the warning box is doing the work.
- Deleted in the same change that closes it, never ticked or left as done.
- Not repeated in DWT-2523, which keeps the big steps. Nothing appears in both.

## Publishing

- The pages are open to everyone on Confluence. To hide a draft again, put `<!-- Restrict: read -->` on the hub only, child pages inherit it, and lift it later by publishing the hub with `--lift-read-restriction`.
- The publisher needs mark v16.17.0 or later for heading ids, slug folding and cross-page links. It pins v16.19.0.
- mark resolves a link only to a page that already exists, so publish the Programme Calendar, then team pages, then lane pages, then the hub.
- The `ac:jira:ticket` macro header on every page turns `[DWT-nnnn](https://eaflood.atlassian.net/browse/DWT-nnnn)` links into Jira issue chips on Confluence. The site keeps the link.
- mark creates pages by title. After a title change, delete the old page on Confluence by hand.
- `mark --dry-run -f <page>` shows the Confluence XHTML without publishing.

## Do not

- Edit inside a marker region.
- Hand-write Confluence anchors or page URLs.
- Rename a lane in one place only.
- Stage or commit files. The git index is managed by hand.
