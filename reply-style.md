# Reply style (emphasis)

These rules shape replies in this terminal. A display plugin draws each `[[Word]]` marker as a pill whose shape shows its family and whose color shows its state; the stored message keeps plain Markdown. Use exactly the words below; a known word may carry short detail ([[Completed 16/16]], [[Deviation D75]]). Any other word is drawn as a dim tag.

- **Markers are required where their trigger applies.** Skipping one hides information the user scans for. The triggers:
  - **Mode.** The reply reports an investigation, an analysis, a run or a change, or proposes next steps: its first paragraph is the brief, which starts with one of these: [[Investigate]] (I looked into something and report what I found), [[Propose]] (I suggest what to do next), [[Changed]] (I edited files, data or jobs), [[Ran]] (I ran an analysis, test or job).
  - **Evidence.** You state a finding, a number or a result: start its bullet or paragraph with where it comes from, before the bold lead label. When claims in one bullet have different sources, split the bullet. When every item of a list has the same source, one tag on the list's lead line covers the list: [[Observed]] (checked on disk or in a run), [[Inferred]] (reasoned from other evidence), [[Unverified]] (not checked), [[Cited]] (taken from a paper or doc, not checked here).
  - **Status.** A piece of work has an outcome (done, passed, partly done, failed, blocked): put the status beside it, with a count as detail, such as [[Partial 6/8]]: [[Done]] (finished), [[Passed]] (tests or checks passed), [[Handed over]] (work returned to the lead), [[Fixed]] (a defect repaired), [[Recommended]] (the option I pick), [[Failed]] (something broke), [[Blocked]] (cannot proceed), [[Partial]] (some of it done), [[Skipped]] (left out on purpose), [[At risk]] (could fail).
  - **Verdict.** The user stated a claim or asked you to confirm one: open the answer with the verdict: [[Confirmed]] (the claim holds), [[Corrected]] (the claim is partly wrong), [[Contradicted]] (the claim is wrong).
  - **Ask.** Something only the user can do or decide: give it its own paragraph at the end of the reply, starting with the ask: [[Needs you]] (an action only the user can take), [[Decision]] (a call only the user makes).
  - **Gate.** A result is judged against a threshold fixed before the run. A miss starts an investigation of why, never a verdict on its own; Fold only after an independent review agrees: [[Gate met]] (a pre-registered gate passed), [[Gate missed]] (a gate missed; starts an investigation of why, not a verdict), [[Fold]] (direction abandoned, only after independent review), [[Shelve]] (paused for lack of resources; the project lead decides), [[Exploratory]] (no gate applies), [[Underpowered]] (a null too weak to settle anything).
  - **Flag.** You changed the plan, fell back or compromised without telling the user beforehand: flag it and follow with **Logged:** and the path of the .md that records it: [[Deviation]] (an undisclosed fallback or compromise).
  - **Job.** You report the state of a scheduler job; put its id after the word, such as [[OOM 52084096]]: [[Submitted]] (sent to the scheduler), [[Queued]] (waiting in the queue), [[Running]] (running), [[Completed]] (exit 0), [[Cancelled]] (cancelled), [[OOM]] (out of memory), [[Killed 143]] (SIGTERM, usually the time limit).
  - **Owner.** You touched, or propose to touch, data, code or configuration that is not this task's own: [[Owned]] (made by this task), [[Shared]] (lab-shared storage others use), [[Foreign]] (someone else's, such as another person's derivatives).
  - **Hazard.** Before an action that deletes, cannot be undone, or spends GPU allocation; say what is lost or spent: [[Destructive]] (deletes or overwrites), [[Irreversible]] (cannot be undone), [[GPU quota]] (spends GPU allocation).
- **Brief.** One to three plain sentences after the mode marker: what was checked, done or proposed, the outcome, and anything the user must do. No other markers and no bold inside it; the display draws it as a card with the mode in its border. Skip the brief for short answers, conceptual explanations, and manuscript text.
- **Same place every time.** An evidence tag at the start of its bullet or paragraph; a verdict right after the bold lead label it answers; a status beside the item or on the lead line of its list; an ask at the start of the last paragraph. At most two markers on a line, except a row of job states; when a reply would need more than about ten, put the items in a table with a column of markers.
- **Every attention marker carries its action.** After [[Unverified]], [[Gate missed]], [[Failed]], [[Blocked]], [[Partial]], [[Needs you]], [[Decision]], [[Deviation]], a hazard or a failed job, give the one fact needed to act, introduced by a bold lead-in ending in a colon: **Check:**, **Do:**, **Next:**, **Unblock:**, **Left:**, **Run:**, **Guard:**, **Undo:**, **See:**, **Logged:**.
- **Check before sending** a reply that reports work: it opens with the brief; each finding starts with an evidence tag (or its list's lead line has one); each outcome has a status; each ask is the last paragraph.
- **Statistics stay in words and numbers.** Report effects with their CI or adjusted p in plain text; do not make significance into a marker. [[Underpowered]] is the exception.
- **Bold lead labels, sparingly elsewhere.** Start a bullet that is about one subject with a bold lead label ending in a colon (**Cause:**). Inside sentences, bold at most one or two anchor terms per paragraph. Preferred lead labels: Question, Answer, Data, Cohort, Method, Model, Result, Effect, Evidence, Caveat, Gate, Deviation, Claim, Cause, Fix, Risk, Next, Decision, Status, Plan, Why, How.
- **Keep text that will be copied clean.** No markers, bold labels or tree shapes in manuscript paragraphs (give those as blockquotes), paths, commands, code, literal output, or anything written to a file.
- **Shape follows information.** `├──` and `└──` for what belongs to what, `→` for a sequence, `✓` or `✗` beside a checked item in a table.

A reply that follows these rules:

```markdown
[[Ran]] I tested the review skill blind on one published paper. It found 6 of the 8 defects I planted and left the untouched paper's matching passages alone. One decision is needed below.

**Broken copy** [[Partial 6/8]]
- [[Observed]] **Mechanism paragraph:** flagged as the top comment.
- **"little is known" gap:** missed; the new phrase scan now catches it. [[Fixed]]

[[Observed]] **Original paper:** it praised the six passages I had broken in the copy.

[[Inferred]] **Era:** it holds drafts to his 2023 to 2025 habits rather than the 2021 paper's.

[[Decision]] hold your drafts to his current habits, or to the era of each paper? I'd use current. **Next:** I'll record each habit's era in the profile.
```
