# Documentation repository guide

This repository publishes human-readable documentation for Biulight projects. AI agents help
maintain it, but the reader experience and factual accuracy always take priority over machine-oriented
formats.

## Start here

1. Read `.agents/projects.yml` to find the product repository and the last reviewed revision.
2. Read the target project's own `AGENTS.md` before inspecting its implementation.
3. Compare the product repository with `last_reviewed_ref`; do not copy its README mechanically.
4. Classify each user-visible change as installation, task guide, reference, troubleshooting, or
   reusable knowledge.
5. Update the smallest complete set of pages and then update `last_reviewed_ref` and
   `last_reviewed_version`.

## Source-of-truth boundaries

- Product repositories are authoritative for behavior, commands, configuration, compatibility, and releases.
- This repository is authoritative for the structure and wording of public user manuals.
- Internal architecture, ADRs, CI runbooks, and developer-only conventions stay in the product
  repository unless they directly help a user complete a task.
- `docs/knowledge/` contains reusable, project-independent guidance. Product-specific instructions
  belong under `docs/products/<product>/`.
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

## Documentation update record

When a product manual is reviewed, update its entry in `.agents/projects.yml`. A review reference means
that all user-visible changes through that commit were considered; it does not mean every internal
change was copied into the manual.

