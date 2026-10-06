# Workspace Agent Instructions & Workflow Router

Welcome to the **Personal Fitness Tracker** (`personal-fitness`) repository.
This repository operates under a strict, autonomous multi-skill workflow orchestrated by the **Workflow Router**.

## Executive Rule: Autonomous Skill Routing

Whenever receiving a request or task, you **MUST** automatically identify the matching phase and activate the corresponding skills from `.agent/skills/` before generating code or taking action.

See [`.agent/WORKFLOW_ROUTER.md`](.agent/WORKFLOW_ROUTER.md) for the full architecture and execution runbooks.

---

### Quick Routing Decision Matrix

| When You Are Doing... | You MUST Activate These Skills |
| :--- | :--- |
| **New features, large refactors, or multi-file edits (>2 files)** | `work-packages` (Mandatory work breakdown before code changes)<br>`grill-me` (If trade-offs, schemas, or requirements are ambiguous) |
| **Writing or editing React 19 / TS / CSS code** | `anti-cliche` (Mandatory 2026 standards: no legacy hooks, no `@apply`, no barrel files)<br>`typescript` (Strict typing, no `any`)<br>`tailwind-css` (Tailwind v4 CSS-first `@theme`) |
| **Creating UI components or interactive screens** | `animejs-animation` (Motion, micro-interactions, celebrations)<br>`storybook` (Isolated component stories and testing)<br>`axe-playwright` (WCAG 2.2 AA accessibility verification) |
| **API endpoints (`functions/api/`) or D1 SQLite data** | `zod` (Mandatory payload & boundary validation)<br>`typescript` (Strict D1 interfaces)<br>`jsdoc` (Public method documentation) |
| **Bug fixing or troubleshooting** | `clinical-tone` (Staff+ diagnostic tone, root-cause first)<br>`typescript`<br>`playwright-test` (Regression spec) |
| **Performance tuning or bundle auditing** | `pagespeed-insights`<br>`anti-cliche` |
| **Public pages, workout guides, or search discovery** | `seo` (Programmatic SEO playbooks & templates)<br>`json-ld` (Schema.org rich snippets)<br>`sitemap` (Crawl indexing)<br>`llms-txt` (AI agent discovery) |
| **Code reviews or PR audits** | `code-review` (Audit diff against `develop`)<br>`clinical-tone`<br>`anti-cliche` |
| **Git staging & commits** | `split-commit` (If multiple unrelated changes exist)<br>`conventional-commits` (Strict `lefthook` & branch compatibility) |

---

### Strict Engineering Invariants

1. **No Code Before Verification on Large Tasks**: Never write code on major changes without presenting atomic Work Packages (`WP-01`, `WP-02`) with single-sentence tasks to the user first (`work-packages`).
2. **React 19 & Tailwind v4 Compliance**:
   - ❌ **NEVER** use `useMemo`, `useCallback`, or `React.memo` (React Compiler handles memoization).
   - ❌ **NEVER** use `forwardRef` (use standard `ref` prop).
   - ❌ **NEVER** use `useContext` (favor the `use()` hook).
   - ❌ **NEVER** use `@apply` in CSS.
   - ❌ **NEVER** create JavaScript class constant maps (`const STYLES = ...`).
   - ❌ **NEVER** use barrel files (`index.ts`) for re-exporting.
3. **Quarantined Skills Blocklist**:
   - 🚫 **GSAP is deprecated**: Use `animejs-animation` or native `motion`.
   - 🚫 **shadcn-ui is deprecated**: Use the custom Liquid Glass Design System in `src/` + `tailwind-css`.
4. **Pre-Commit Quality Gates**:
   Before staging any changes, verify:
   ```bash
   make format-check && make lint && make type-check
   ```
