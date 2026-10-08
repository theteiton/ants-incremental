---
description: Run the post-release retrospective so every agent records its experience
argument-hint: <version, e.g. v1.2.0>
---

Run the post-release retro for release **$ARGUMENTS**. Follow the "Experience system" section of CLAUDE.md exactly.

## Steps
0. **Snapshot.** Run `node .claude/tools/retro-tools.js snapshot $ARGUMENTS` so every agent's memory is saved before it changes.
1. **Facts first.** Dispatch the `release-manager` agent to write `docs/retro/$ARGUMENTS-facts.md` from the changelog, git log, every agent log in `docs/agent-logs/` (Auto-records, verdicts and overseer entries included), tester bug reports, reviewer findings, overseer denies and asks, and any post-release issues the user mentions. Facts only, each with a reference. Do not continue until the file exists.
2. **Everyone reflects.** Dispatch all ten agents in parallel (manager, thinker, game-designer, engineer, developer, ui-designer, tester, reviewer, release-manager, overseer), each with this prompt:

   > RETRO for $ARGUMENTS. Read `docs/retro/$ARGUMENTS-facts.md`, your own log `docs/agent-logs/<your-name>.md` (everything since the last release marker, plus any Feedback without a Resolution), and your own MEMORY.md. Then update ONLY your own MEMORY.md: (1) using the Feedback others left in your log, the Auto-records, and your own "what I would do differently" notes as the main evidence, add a Release log entry for this project and $ARGUMENTS covering what you did, what went well, and what went wrong, with evidence; (2) add, revise, or remove Core lessons using the promotion rules in CLAUDE.md (your memory is shared by all projects, so Core lessons must generalize); (3) compress Release log entries older than the last 5 into one line each. Keep the file under 120 lines. Finish with a report of at most 10 lines listing what you added, changed, and removed, with one-line reasons. Follow your Retro focus from your agent file.

3. **Review for the user.** Run `node .claude/tools/retro-tools.js diff $ARGUMENTS` and show the user every memory change, with the ten reports. Flag any lesson that lacks evidence, exceeds the 15-entry cap, or contradicts another agent's lesson. Then ask the user to approve or reject changes. Do not start new project work until they respond. To reject a change, restore the agent's file from `docs/retro/$ARGUMENTS-memory-before/`.
4. **Close the release.** Once the user has responded, for each of the ten agents run the log tool (each one is a separate command):
   ```
   node .claude/tools/log-append.js --agent <name> --kind marker --from lead --text "Release $ARGUMENTS retro closed <today's date>"
   ```
