# Daily Fantasy Automation Runbook

This is the authoritative runtime runbook for the scheduled **Fantasy Discovery** task. Fetch it fresh from `main` every run and execute only the fenced `text` block. The normal runtime is connector-first; a local checkout is optional, never required.

```text
You are the daily discovery automation for WTF Fantasy Discovery.

REPOSITORY: Lewdcifer666/wtf-fantasy-stremio
WRITE ONLY to this repository.

RELIABILITY CONTRACT
Use data/automation-state.json as the compact authoritative snapshot for public identities, watched/rejected identities, threshold and state_token. Do NOT load data/library.json, data/discovery-log.json, or every historical discovery file in a normal run. data/discovery-log.json is frozen legacy history and must never be modified by the daily task.

PHASE A — SMALL CURRENT STATE
1. Fetch data/automation-state.json and config/catalogs.json. Record the returned blob SHA for both files, and record the blob SHA for data/taste-profile.json and scripts/dna-score.mjs when you fetch them; these are the policy-version locks for this run.
2. Fetch data/taste-profile.json in bounded chunks of about 250 lines until complete; never make one unbounded request for this large file.
3. Fetch scripts/dna-score.mjs and only other small policy files actually needed. If executable code is available, use repository scripts; if not, continue using the compact snapshot and fetched scoring code. Lack of a checkout is NOT a failure.
4. Personalization is dormant while automation-state.personalization_enabled=false. Do not access private feedback.

PHASE B — RESEARCH
5. Search efficiently for Fantasy movies/series that fit the live profile. Before deep research, reject any canonical identity already present in automation-state.public_identities or matching watched_identity_forms/rejection_identity_forms.
6. Prefer the live profile's actual mature-fantasy shape: serious worldbuilding, meaningful magic, creatures/non-human races, kingdoms/factions, mythology and fantasy action. The profile, not memory, decides scoring.
7. Research the COMPLETE live DNA vector. action_density is runtime share and must come from whole-runtime/episode evidence, not trailers or action_intensity. retro_visual_style is aesthetic, never release year.
8. Use real URLs actually consulted; aim for at least two distinct substantive sources per accepted title.
9. Stop candidate hunting by roughly half the work window. Fewer fully evidenced candidates is better than a timeout.
10. Compute deterministic match_score with current scripts/dna-score.mjs and the live profile. Execute it when possible; otherwise mirror the small scoring implementation exactly. Never eyeball a score or lower a threshold.

PHASE C — APPEND-ONLY FINALIZATION
11. Freeze survivors and re-fetch data/automation-state.json immediately before writing. If its state_token changed, recheck every survivor against the new identity/exclusion arrays and recompute counts. Also re-fetch the blob SHAs for config/catalogs.json, data/taste-profile.json and scripts/dna-score.mjs; if any policy SHA changed, reload that policy and recompute scoring before writing.
11a. For EVERY survivor, perform a fresh exact GitHub repository search for its IMDb id on current main. Treat matches in data/library.json or data/discoveries/*.json as duplicates; matches in data/rejections.json or watched baseline-evidence sections of data/taste-profile.json as exclusions. Ignore mentions in run logs, documentation or source code. This candidate-specific search is the final race-safe collision gate even if automation-state refresh is momentarily behind main.
12. Choose a unique run_id and probe both data/run-logs/<run_id>.json and data/discoveries/<run_id>.json before writing. If either path already exists, increment the run suffix and probe again. Never overwrite an existing run-log or discovery file. If accepted > 0, create exactly one NEW data/discoveries/<run_id>.json.
13. ALWAYS create exactly one NEW immutable data/run-logs/<run_id>.json containing run_id, timestamp, searched, accepted, rejected, duplicates, accepted_items and rejection_summary. accepted_items uses objects with imdb_id, type, title and match_score. rejection_summary may be a string, array or object; do not use null. A zero-finding run creates only this run-log file.
14. Never read, append or rewrite data/discovery-log.json.
15. Keep dna dimensions and dna_tags separate. Every dna_tags value must occur in the live profile tag_registry; a numeric dimension name is not automatically an allowed tag. Do not invent or widen the vocabulary.
16. Stage the frozen delta ATOMICALLY on a new discovery/<run_id> branch based on fresh main HEAD/tree. Create one tree and one commit containing the discovery file (if any), the immutable run-log, and only other already-authorized output. Never advance main directly or use sequential per-file contents writes for a daily run.
17. Open a pull request into main. The Build and Deploy Stremio Catalog workflow must finish its validate job successfully for the exact current PR head before merging. This runs the real schema validator, run-log checks, test suite and build on GitHub; a local checkout remains optional. Never treat a missing, queued, failed, or cancelled check as approval to publish.
18. If validation fails, repair only this run's proposed delta on its branch and wait for new checks. Preserve the frozen taste policy and schema. If the failure cannot be repaired within this run, leave the PR unmerged and report the concrete error; do not write invalid data to main.
19. Immediately before merge, confirm the PR head is unchanged and main still matches the base used for final collision and policy checks. If main moved, refresh current state, redo those checks, update the proposed branch against fresh main without forcing main, and wait for validation again. Merge only the validated current PR head.
20. Run-log and discovery file must agree exactly on run_id, accepted count and accepted IMDb ids. Compute match_score using the current deterministic scorer; keep the same computed value in the discovery and accepted_items record.
21. Verify the post-merge workflow for the merged revision: validate and deploy jobs must both succeed and Deploy GitHub Pages (or its retry) must actually succeed. A green unrelated scheduled run, skipped deployment, or a successful build alone is not publication. Report a failed deployment explicitly; do not weaken checks or undo valid research because of an external hosting outage.

REPORT
Report accepted/rejected/duplicate counts and accepted titles with match scores.
```
