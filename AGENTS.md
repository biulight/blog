# Documentation repository guide

This repository publishes human-readable documentation for Biulight projects. AI agents help
maintain it, but the reader experience and factual accuracy always take priority over machine-oriented
formats.

## Start here

1. Read `.agents/projects.yml` to find the product repository, public manual, and local portal.
2. Read the target project's own `AGENTS.md` before inspecting its implementation.
3. Treat a migrated product repository's bilingual manual as authoritative; do not recreate it here
   from its README or maintain a second copy.
4. Classify each user-visible change as installation, task guide, reference, troubleshooting, or
   reusable knowledge.
5. Keep product portals and legacy redirect pages valid when a migrated manual changes routes.

## Source-of-truth boundaries

- Product repositories are authoritative for behavior, commands, configuration, compatibility, and releases.
- Product repositories are authoritative for migrated public user manuals. This repository is
  authoritative for Biulight product portals, public knowledge, and blog content.
- Internal architecture, ADRs, CI runbooks, and developer-only conventions stay in the product
  repository unless they directly help a user complete a task.
- `docs/knowledge/` contains reusable, project-independent guidance. For a migrated product,
  `docs/products/<product>/` contains only its portal and compatibility redirects; full
  product-specific instructions belong in the product repository.
- Never invent behavior from an issue, plan, or TODO. Verify it in released code, command definitions,
  tests, or release artifacts.

## Writing standard

- Write primarily in Simplified Chinese. Keep commands, identifiers, paths, and official product names unchanged.
- Lead with the user's goal and expected result. Explain implementation details only when they affect
  a decision or help diagnose a failure.
- State supported platforms, prerequisites, destructive effects, and safe preview commands near the relevant step.
- Prefer short task-focused pages over a single exhaustive README. Link to shared concepts instead of duplicating them.
- Examples must use placeholders rather than real credentials, private hosts, or personal paths.
- Use the templates in `.agents/templates/` when adding a new page type.

## Required verification

- Check every documented command and option against the current command definitions or `--help`.
- Check configuration keys against the parser/defaults in the product repository.
- Run `pnpm build` in this repository; broken links are release blockers.
- Run `pnpm typecheck` when React, TypeScript, navigation, or theme code changes.
- Review `git diff --check` and `git status --short`. Preserve unrelated user changes.

## Product portal update record

When a manual is migrated, update `last_migrated_ref` and `last_migrated_version`. Ongoing behavior
and translation reviews happen in the product repository; this repository tracks portal and
legacy-route compatibility after migration.
