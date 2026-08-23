# Documentation review report format

Use the smallest report that still makes the review auditable. Omit empty sections.

## Outcome

State whether documentation was updated, found current, or blocked. Include the review mode and comparison range.

## Change mapping

For a bilingual product manual, use this table:

| User-visible change | Classification | English page | Simplified Chinese page | Evidence |
| --- | --- | --- | --- | --- |
| Short behavior description | installation / guide / reference / troubleshooting / knowledge | Path or none | Path or none | Command definition, parser, test, or release artifact |

Use `none — no documentation impact` only with a concrete reason.

## Repository impact

Summarize separately:

- Product repository: manual and product-owned documentation changes.
- Public documentation repository: portal, knowledge, and legacy route changes.
- Private documentation repository: synchronized public inputs and internal extensions.

When another repository is affected but outside the authorized write scope, label it `follow-up`, not `completed`.

## Verification

List only checks actually run, with pass/fail status. Include representative route or generated-page inspection for locale or redirect changes.

## Risks and follow-ups

Report:

- incomplete locale coverage
- behavior that could not be verified
- route changes without compatibility handling
- private documentation requiring an authorized follow-up
- pre-existing warnings that may affect future releases

Do not include credentials, private hostnames, personal filesystem paths, or sensitive command output.
