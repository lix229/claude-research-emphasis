// emphasis: research-flavored status pills for Claude Code replies.
// Parses assistant Markdown into blocks of styled runs: [[Word]] pills, colored bold,
// labeled headings and lead labels, colored marks. Tables, code fences and HTML stay
// Markdown and are drawn by Claude Code's own renderer.

export type IconSet = 'unicode' | 'nerd-font' | 'none'

export type Run = {
  s: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  dim?: boolean
  color?: string
  bg?: string
  href?: string
}

export type Block =
  | { k: 'md'; text: string }
  | { k: 'heading'; level: number; runs: Run[] }
  | { k: 'para'; runs: Run[] }
  | { k: 'item'; indent: number; marker: string; runs: Run[] }
  | { k: 'quote'; runs: Run[] }
  | { k: 'brief'; mode: Run[]; border: string; runs: Run[] }
  | { k: 'blank' }
  | { k: 'lines'; lines: Run[][] }

export type Palette = 'tinted' | 'bright'
export type Settings = { icons: IconSet; boldColor: string; palette?: Palette; maxWidth?: number }

/**
 * Pill families. Each family has its own shape, so a glance tells evidence from a gate from a job:
 *   evidence  ◉ Observed          glyph + colored word, no background
 *   verdict   █ ✓ CONFIRMED █     solid stamp, dark text, upper case
 *   gate      ◖▲ Gate met◗        tinted chip with round ends
 *   status    ▐✓ Done▌            tinted chip with square half-block ends
 *   ask       ▶ Needs you         bold amber, underlined
 *   flag      ▌ Deviation         strong left bar, tinted body, open right end
 *   job       [● Running]         dim brackets around a colored state
 *   owner     @foreign            lower-case handle, underlined
 *   hazard    ▚ DESTRUCTIVE ▚     solid red with hazard ends
 *   context   ‹ New ›             dim, in guillemets (any other word)
 *   mode      ◆ INVESTIGATE        opens a reply's brief card; inline, a solid tag
 */
export type Family = 'mode' | 'evidence' | 'verdict' | 'gate' | 'status' | 'ask' | 'flag' | 'job' | 'owner' | 'hazard' | 'context'
export type Hue = 'green' | 'red' | 'amber' | 'blue' | 'violet' | 'magenta' | 'cyan' | 'grey'

/** Per hue: the bright text color, a dark wash for chip backgrounds, a saturated fill for stamps. */
export const HUES: Record<Hue, { fg: string; wash: string; solid: string }> = {
  green: { fg: '#86e1a6', wash: '#1d3b2a', solid: '#3fb96a' },
  red: { fg: '#ff9aa6', wash: '#4a1d26', solid: '#e5484d' },
  amber: { fg: '#f6cf6a', wash: '#463610', solid: '#f0b429' },
  blue: { fg: '#9dbcff', wash: '#1c2d57', solid: '#4c7dff' },
  violet: { fg: '#c9a7ff', wash: '#33264f', solid: '#8b5cf6' },
  magenta: { fg: '#f3a1d6', wash: '#4a1f3d', solid: '#d6409f' },
  cyan: { fg: '#79deef', wash: '#123c46', solid: '#22b8cf' },
  grey: { fg: '#b9c2da', wash: '#2b3040', solid: '#6b7280' },
}
/** The same hues as theme keys, for the `bright` palette on a light theme. */
const THEME_HUES: Record<Hue, { fg: string; wash: string; solid: string }> = {
  green: { fg: 'success', wash: 'success', solid: 'success' },
  red: { fg: 'error', wash: 'error', solid: 'error' },
  amber: { fg: 'warning', wash: 'warning', solid: 'warning' },
  blue: { fg: 'suggestion', wash: 'suggestion', solid: 'suggestion' },
  violet: { fg: 'merged', wash: 'merged', solid: 'merged' },
  magenta: { fg: 'magenta', wash: 'magenta', solid: 'magenta' },
  cyan: { fg: 'cyan', wash: 'cyan', solid: 'cyan' },
  grey: { fg: 'inactive', wash: 'inactive', solid: 'inactive' },
}

type Word = { family: Family; hue: Hue; glyph: string; meaning: string }

/** The words the model is told to write, in the order the rules list them. */
export const WORDS: Record<string, Word> = {
  // Kind of work: opens the brief card at the top of a reply.
  Investigate: { family: 'mode', hue: 'cyan', glyph: '⌕', meaning: 'I looked into something and report what I found' },
  Propose: { family: 'mode', hue: 'violet', glyph: '➜', meaning: 'I suggest what to do next' },
  Changed: { family: 'mode', hue: 'green', glyph: '✎', meaning: 'I edited files, data or jobs' },
  Ran: { family: 'mode', hue: 'blue', glyph: '▶', meaning: 'I ran an analysis, test or job' },
  // Evidence: where a claim comes from.
  Observed: { family: 'evidence', hue: 'green', glyph: '◉', meaning: 'checked on disk or in a run' },
  Inferred: { family: 'evidence', hue: 'blue', glyph: '◐', meaning: 'reasoned from other evidence' },
  Unverified: { family: 'evidence', hue: 'amber', glyph: '○', meaning: 'not checked' },
  Cited: { family: 'evidence', hue: 'violet', glyph: '§', meaning: 'taken from a paper or doc, not checked here' },
  // Verdict on a claim the user made.
  Confirmed: { family: 'verdict', hue: 'green', glyph: '✓', meaning: 'the claim holds' },
  Corrected: { family: 'verdict', hue: 'amber', glyph: '±', meaning: 'the claim is partly wrong' },
  Contradicted: { family: 'verdict', hue: 'red', glyph: '✗', meaning: 'the claim is wrong' },
  // Gates.
  'Gate met': { family: 'gate', hue: 'green', glyph: '▲', meaning: 'a pre-registered gate passed' },
  'Gate missed': { family: 'gate', hue: 'amber', glyph: '▽', meaning: 'a gate missed; starts an investigation of why, not a verdict' },
  Fold: { family: 'gate', hue: 'red', glyph: '■', meaning: 'direction abandoned, only after independent review' },
  Shelve: { family: 'gate', hue: 'grey', glyph: '‖', meaning: 'paused for lack of resources; the project lead decides' },
  Exploratory: { family: 'gate', hue: 'cyan', glyph: '◇', meaning: 'no gate applies' },
  Underpowered: { family: 'gate', hue: 'violet', glyph: '∅', meaning: 'a null too weak to settle anything' },
  // Work status.
  Done: { family: 'status', hue: 'green', glyph: '✓', meaning: 'finished' },
  Passed: { family: 'status', hue: 'green', glyph: '✓', meaning: 'tests or checks passed' },
  'Handed over': { family: 'status', hue: 'blue', glyph: '⇄', meaning: 'work returned to the lead' },
  Fixed: { family: 'status', hue: 'green', glyph: '✓', meaning: 'a defect repaired' },
  Recommended: { family: 'status', hue: 'green', glyph: '★', meaning: 'the option I pick' },
  Failed: { family: 'status', hue: 'red', glyph: '✗', meaning: 'something broke' },
  Blocked: { family: 'status', hue: 'red', glyph: '⊘', meaning: 'cannot proceed' },
  Partial: { family: 'status', hue: 'amber', glyph: '◑', meaning: 'some of it done' },
  Skipped: { family: 'status', hue: 'amber', glyph: '»', meaning: 'left out on purpose' },
  'At risk': { family: 'status', hue: 'amber', glyph: '!', meaning: 'could fail' },
  // Asks.
  'Needs you': { family: 'ask', hue: 'amber', glyph: '▶', meaning: 'an action only the user can take' },
  Decision: { family: 'ask', hue: 'amber', glyph: '▶', meaning: 'a call only the user makes' },
  // Disclosure.
  Deviation: { family: 'flag', hue: 'magenta', glyph: '', meaning: 'an undisclosed fallback or compromise' },
  // Slurm jobs.
  Queued: { family: 'job', hue: 'grey', glyph: '◷', meaning: 'waiting in Slurm' },
  Submitted: { family: 'job', hue: 'grey', glyph: '↑', meaning: 'sent to Slurm' },
  Running: { family: 'job', hue: 'cyan', glyph: '●', meaning: 'running' },
  Cancelled: { family: 'job', hue: 'grey', glyph: '⊘', meaning: 'cancelled' },
  Completed: { family: 'job', hue: 'green', glyph: '✓', meaning: 'exit 0' },
  OOM: { family: 'job', hue: 'red', glyph: '✗', meaning: 'out of memory' },
  'Killed 143': { family: 'job', hue: 'red', glyph: '✗', meaning: 'SIGTERM, usually the time limit' },
  // Ownership of data and code.
  Owned: { family: 'owner', hue: 'grey', glyph: '@', meaning: 'made by this task' },
  Shared: { family: 'owner', hue: 'blue', glyph: '@', meaning: 'lab-shared storage others use' },
  Foreign: { family: 'owner', hue: 'amber', glyph: '@', meaning: 'someone else\'s, such as another person\'s derivatives' },
  // Consequences.
  Destructive: { family: 'hazard', hue: 'red', glyph: '▚', meaning: 'deletes or overwrites' },
  Irreversible: { family: 'hazard', hue: 'red', glyph: '▚', meaning: 'cannot be undone' },
  'GPU quota': { family: 'hazard', hue: 'amber', glyph: '▚', meaning: 'spends GPU allocation' },
}

/** Other spellings that display as a listed word. */
const SYNONYMS: Record<string, string> = {
  complete: 'Done', ok: 'Done', finished: 'Done', pass: 'Passed',
  fail: 'Failed', failing: 'Failed', error: 'Failed', broken: 'Failed',
  'gate passed': 'Gate met', 'gate pass': 'Gate met', 'gate miss': 'Gate missed',
  confirm: 'Confirmed', refuted: 'Contradicted', wrong: 'Contradicted',
  pending: 'Queued', waiting: 'Queued', 'in progress': 'Running',
  'out of memory': 'OOM', killed: 'Killed 143', 'timed out': 'Killed 143', timeout: 'Killed 143',
  'costs money': 'GPU quota',
}

const KEYS = new Map<string, string>([
  ...Object.keys(WORDS).map(w => [w.toLowerCase(), w] as [string, string]),
  ...Object.entries(SYNONYMS),
])
const KNOWN = [...KEYS.keys()].sort((a, b) => b.length - a.length)

/** A pill label read as its word plus any detail ("Completed 16/16", "Deviation D75"). */
export function readLabel(label: string): { word: string | undefined; detail: string; text: string } {
  const text = label.replace(/\s+/g, ' ').trim()
  const lower = text.toLowerCase()
  const known = KNOWN.find(k => lower === k || (lower.startsWith(k) && /[ :]/.test(lower[k.length] ?? '')))
  if (!known) return { word: undefined, detail: '', text }
  return { word: KEYS.get(known), detail: text.slice(known.length), text }
}

/** The hue of a mode word, for the brief card's border; undefined for any other label. */
export function modeHue(label: string, set: Settings): string | undefined {
  const { word } = readLabel(label)
  const w = word ? WORDS[word] : undefined
  return w?.family === 'mode' ? (set.palette === 'bright' ? THEME_HUES : HUES)[w.hue].fg : undefined
}

export function pillRuns(label: string, set: Settings): Run[] {
  const { word, detail, text } = readLabel(label)
  const nb = (s: string) => s.replace(/ /g, ' ')
  if (!word) return [{ s: nb(`‹ ${text} ›`), dim: true }]
  const w = WORDS[word]!
  const h = (set.palette === 'bright' ? THEME_HUES : HUES)[w.hue]
  const g = set.icons === 'none' ? '' : w.glyph
  const shown = nb(word + detail)
  switch (w.family) {
    case 'evidence':
      return [{ s: nb(`${g ? g + ' ' : ''}${shown}`), color: h.fg, bold: true }]
    case 'verdict':
      return [{ s: nb(` ${g ? g + ' ' : ''}${shown.toUpperCase()} `), bg: h.solid, color: '#101010', bold: true }]
    case 'gate':
      return [
        { s: '◖', color: h.wash },
        { s: nb(`${g ? g + ' ' : ''}${shown}`), bg: h.wash, color: h.fg, bold: true },
        { s: '◗', color: h.wash },
      ]
    case 'status':
      if (set.icons === 'nerd-font') {
        return [
          { s: '', color: h.wash },
          { s: nb(`${g} ${shown}`), bg: h.wash, color: h.fg, bold: true },
          { s: '', color: h.wash },
        ]
      }
      return [
        { s: '▐', color: h.wash },
        { s: nb(`${g ? g + ' ' : ''}${shown}`), bg: h.wash, color: h.fg, bold: true },
        { s: '▌', color: h.wash },
      ]
    case 'ask':
      return [{ s: nb(`${g ? g + ' ' : ''}${shown}`), color: h.solid, bold: true, underline: true }]
    case 'flag':
      return [
        { s: '▌', color: h.solid },
        { s: nb(` ${shown} `), bg: h.wash, color: h.fg, bold: true },
      ]
    case 'job':
      return [
        { s: '[', dim: true },
        { s: nb(`${g ? g + ' ' : ''}${shown}`), color: h.fg, bold: true },
        { s: ']', dim: true },
      ]
    case 'owner':
      return [{ s: nb(`@${shown.toLowerCase()}`), color: h.fg, underline: true }]
    case 'hazard':
      return [
        { s: '▚', color: '#101010', bg: h.solid },
        { s: nb(` ${shown.toUpperCase()} `), bg: h.solid, color: '#ffffff', bold: true },
        { s: '▚', color: '#101010', bg: h.solid },
      ]
    case 'context':
      return [{ s: nb(`‹ ${shown} ›`), dim: true }]
    case 'mode':
      return [{ s: nb(` ${g ? g + ' ' : ''}${shown.toUpperCase()} `), color: h.fg, bg: h.wash, bold: true }]
  }
}

/** Nerd Font icons for a `##` heading or a line's leading bold label. */
export const LABEL_ICONS: Record<string, string> = {
  question: '', answer: '', data: '', cohort: '', method: '', model: '',
  result: '', effect: '', evidence: '', caveat: '', gate: '', deviation: '',
  claim: '', cause: '', fix: '', risk: '', next: '', decision: '',
  status: '', plan: '', why: '', how: '',
}
/** Bold lead-ins that name the action a pill calls for. */
export const ACTION_WORDS = ['Check', 'Do', 'Next', 'Unblock', 'Left', 'Run', 'Guard', 'Undo', 'See', 'Logged']
const NERD_ACTION: Record<string, string> = {
  check: '', do: '', next: '', unblock: '', left: '', run: '', guard: '',
  undo: '', see: '', logged: '',
}

const OWN_ICON = /^\s*([-]|[\u{f0000}-\u{ffffd}])\s*/u

function labelIcon(label: string, set: Settings, isLead: boolean): string | undefined {
  if (set.icons !== 'nerd-font' || OWN_ICON.test(label)) return undefined
  const word = label.replace(/[:\s]+$/, '').trim().toLowerCase()
  if (isLead && LABEL_ICONS[word]) return LABEL_ICONS[word]
  return label.trimEnd().endsWith(':') ? NERD_ACTION[word] : undefined
}

const PILL = /^\[\[([^[\]\n]{1,32})\]\]/
const LINK = /^\[([^\]\n]+)\]\(([^()\s]+)\)/
const ESCAPABLE = /[\\`*_[\]()#+\-.!~|>{}]/

/** Inline Markdown to styled runs. `leadAt` is the index where a leading bold label would start. */
export function parseInline(src: string, set: Settings, base: Run = { s: '' }, leadAt = -1): Run[] {
  const out: Run[] = []
  let buf = ''
  const flush = () => {
    if (buf) out.push({ ...base, s: buf })
    buf = ''
  }
  const push = (r: Run) => {
    flush()
    out.push(r)
  }
  let i = 0
  while (i < src.length) {
    const ch = src[i]!
    const rest = src.slice(i)
    if (ch === '\\' && i + 1 < src.length && ESCAPABLE.test(src[i + 1]!)) {
      buf += src[i + 1]
      i += 2
      continue
    }
    if (ch === '`') {
      const ticks = /^`+/.exec(rest)![0]
      const close = src.indexOf(ticks, i + ticks.length)
      if (close > i) {
        let code = src.slice(i + ticks.length, close)
        if (code.length > 2 && code.startsWith(' ') && code.endsWith(' ')) code = code.slice(1, -1)
        push({ ...base, s: code, color: 'permission', bold: base.bold, bg: set.palette === 'bright' ? undefined : '#30343f' })
        i = close + ticks.length
        continue
      }
      buf += ticks
      i += ticks.length
      continue
    }
    if (ch === '[') {
      const pill = PILL.exec(rest)
      if (pill && pill[1]!.trim()) {
        flush()
        out.push(...pillRuns(pill[1]!, set))
        i += pill[0].length
        continue
      }
      const link = LINK.exec(rest)
      if (link) {
        flush()
        out.push(...parseInline(link[1]!, set, { ...base, href: link[2]!, color: 'suggestion', underline: true }))
        i += link[0].length
        continue
      }
    }
    if (rest.startsWith('**') || rest.startsWith('__')) {
      const marker = rest.slice(0, 2)
      const close = src.indexOf(marker, i + 2)
      const inner = close > i + 2 ? src.slice(i + 2, close) : ''
      if (inner && !/^\s/.test(inner) && !/\s$/.test(inner)) {
        flush()
        const style: Run = { ...base, s: '', bold: true, ...(set.boldColor ? { color: set.boldColor } : {}) }
        const icon = labelIcon(inner, set, i === leadAt && inner.length <= 32)
        if (icon) out.push({ ...style, s: `${icon} ` })
        out.push(...parseInline(inner, set, style))
        i = close + 2
        continue
      }
    }
    if (ch === '*' && src[i + 1] !== '*' && src[i + 1] !== ' ' && i + 1 < src.length) {
      let close = i + 1
      while ((close = src.indexOf('*', close + 1)) !== -1 && (src[close - 1] === ' ' || src[close + 1] === '*'));
      if (close > i + 1) {
        flush()
        out.push(...parseInline(src.slice(i + 1, close), set, { ...base, italic: true }))
        i = close + 1
        continue
      }
    }
    const tree = /^(?:[├└]──|│)/.exec(rest)
    if (tree) {
      push({ ...base, s: tree[0], dim: true, color: undefined, bold: false })
      i += tree[0].length
      continue
    }
    if (ch === '✓' || ch === '✔' || ch === '✗' || ch === '✘' || ch === '→') {
      push({ ...base, s: ch, color: ch === '→' ? 'claude' : ch === '✓' || ch === '✔' ? 'success' : 'error' })
      i += 1
      continue
    }
    buf += ch
    i += 1
  }
  flush()
  return out
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/
const HEADING = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/
const ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/
const QUOTE = /^ {0,3}>\s?(.*)$/
const TABLE = /^\s*\|/
const RULE = /^ {0,3}([-*_])(\s*\1){2,}\s*$/
const HTML = /^ {0,3}<\/?[a-zA-Z]/

/** Assistant Markdown to blocks. Fences, tables, rules and HTML lines stay Markdown. */
export function parseBlocks(markdown: string, set: Settings): Block[] {
  const blocks: Block[] = []
  const lines = markdown.split('\n')
  let md: string[] = []
  let fence: string | undefined
  const flushMd = () => {
    if (md.length) blocks.push({ k: 'md', text: md.join('\n') })
    md = []
  }
  const last = () => blocks[blocks.length - 1]
  // Raw text of the paragraph or item being built, so wrapped source lines join with a space.
  let open: { raw: string; make: (raw: string) => Block } | undefined
  let firstRaw: string | undefined
  const close = () => {
    if (open) blocks.push(open.make(open.raw))
    open = undefined
  }
  for (const line of lines) {
    const f = line.match(FENCE)
    if (fence !== undefined) {
      md.push(line)
      if (f && f[1]![0] === fence[0] && f[1]!.length >= fence.length && line.trim() === f[1]) fence = undefined
      continue
    }
    if (f) {
      close()
      fence = f[1]!
      md.push(line)
      continue
    }
    if (TABLE.test(line) || RULE.test(line) || HTML.test(line)) {
      close()
      md.push(line)
      continue
    }
    if (md.length) {
      // A blank line or prose ends a Markdown run; a blank line inside it stays with it.
      if (!line.trim()) {
        md.push(line)
        continue
      }
      while (md.length && !md[md.length - 1]!.trim()) md.pop()
      flushMd()
      blocks.push({ k: 'blank' })
    }
    if (!line.trim()) {
      close()
      if (blocks.length && last()?.k !== 'blank') blocks.push({ k: 'blank' })
      continue
    }
    const h = line.match(HEADING)
    if (h) {
      close()
      blocks.push({ k: 'heading', level: h[1]!.length, runs: parseInline(h[2]!, set, { s: '', bold: true }, 0) })
      continue
    }
    const item = line.match(ITEM)
    if (item) {
      close()
      const indent = item[1]!.replace(/\t/g, '  ').length
      const marker = /\d/.test(item[2]!) ? item[2]! : indent >= 2 ? '◦' : '•'
      let lead = 0
      const conn = /^(?:[├└]──\s*)/.exec(item[3]!)
      if (conn) lead = conn[0].length
      open = { raw: item[3]!, make: raw => ({ k: 'item', indent, marker, runs: parseInline(raw, set, { s: '' }, lead) }) }
      continue
    }
    const q = line.match(QUOTE)
    if (q) {
      close()
      blocks.push({ k: 'quote', runs: parseInline(q[1]!, set, { s: '' }) })
      continue
    }
    // Tree rows and lines that open with a bold label start their own line.
    const ownLine = /^\s*(?:[├└│]|\*\*)/.test(line)
    if (open && !ownLine) {
      open.raw += ' ' + line.trim()
      continue
    }
    close()
    const indent = /^\s*/.exec(line)![0].length
    const body = line.slice(indent)
    const conn = /^(?:[├└]──\s*|│\s*)/.exec(body)
    const lead = conn ? conn[0].length : 0
    const pad = ' '.repeat(indent)
    open = {
      raw: body,
      make: raw => {
        if (blocks.length === 0 && firstRaw === undefined) firstRaw = raw
        return { k: 'para', runs: [...(pad ? [{ s: pad }] : []), ...parseInline(raw, set, { s: '' }, lead)] }
      },
    }
  }
  close()
  flushMd()
  const withTables = blocks.flatMap(b => (b.k === 'md' ? splitTables(b.text, set) : [b]))
  blocks.length = 0
  blocks.push(...withTables)
  while (blocks.length && blocks[blocks.length - 1]!.k === 'blank') blocks.pop()
  while (blocks.length && blocks[0]!.k === 'blank') blocks.shift()
  // A reply that opens with a mode pill gets its first paragraph drawn as the brief card.
  const lead = /^\s*\[\[([^[\]\n]{1,32})\]\]\s*/.exec(firstRaw ?? '')
  const border = lead ? modeHue(lead[1]!, set) : undefined
  if (lead && border && blocks[0]?.k === 'para') {
    blocks[0] = {
      k: 'brief',
      mode: pillRuns(lead[1]!, set),
      border,
      runs: parseInline(firstRaw!.slice(lead[0].length), set, { s: '' }),
    }
  }
  return blocks
}

const FAMILY_RULES: [Family, string][] = [
  ['mode', 'Kind of work. Opens the brief (see below); nowhere else'],
  ['evidence', 'Where a claim comes from. Mark every factual claim about data, results or code whose source is not obvious'],
  ['verdict', 'When the user states or asks you to confirm a claim, open the answer with one of these'],
  ['gate', 'Pre-registered pass/stop thresholds for an experiment and their outcomes. A miss starts an investigation of why, never a verdict on its own; Fold only after an independent review agrees'],
  ['status', 'State of a piece of work'],
  ['ask', 'Something only the user can do or decide. Repeat each one in the last line of a long reply'],
  ['flag', 'Any fallback, compromise or change of plan the user was not told about beforehand. Follow it with **Logged:** and the path of the .md that records it'],
  ['job', 'Slurm job states; may carry the job id or counts, e.g. [[Completed 16/16]], [[OOM 52084096]]'],
  ['owner', 'Who owns data, derivatives, code or config you touched or propose to touch'],
  ['hazard', 'Consequences, stated before the action is taken, with what is lost or spent'],
]

/** The reply-style rules for the model, word lists read from the table that draws them. */
export function replyGuidance(): string {
  const byFamily = (f: Family) =>
    Object.entries(WORDS)
      .filter(([, w]) => w.family === f)
      .map(([word, w]) => `[[${word}]] (${w.meaning})`)
      .join(', ')
  const families = FAMILY_RULES.map(([f, rule]) => `  - **${f[0]!.toUpperCase() + f.slice(1)}.** ${rule}: ${byFamily(f)}.`).join('\n')
  return `<reply_style>
These rules shape replies in this terminal. A display plugin draws \`[[Word]]\` pills in a shape and color per family and colors bold text; the stored message keeps plain Markdown.

- **Brief first.** A reply that reports an investigation, an analysis, a run, a change, or proposes what to do next opens with a brief: one paragraph of one to three sentences that starts with a mode pill and says what was checked, done or proposed, the outcome, and anything the user must do. The display draws it as a card. The details follow after a blank line. Skip the brief for short answers, conceptual explanations, and manuscript text.
- **Pills mark status, evidence and decisions only.** A pill is \`[[Word]]\` beside the thing it describes. Use exactly these words; a known word may carry short detail ([[Completed 16/16]], [[Deviation D75]]). Any other word is drawn as a dim tag.
${families}
- **Every attention pill carries its action.** After [[Unverified]], [[Gate missed]], [[Failed]], [[Blocked]], [[Needs you]], [[Decision]], [[Deviation]], a hazard or a failed job, give the one fact needed to act, introduced by a bold lead-in ending in a colon: ${ACTION_WORDS.map(w => `**${w}:**`).join(', ')}.
- **Statistics stay in words and numbers.** Report effects with their CI or adjusted p in plain text; do not make significance into a pill. [[Underpowered]] is the exception.
- **Bold the anchor terms**, one to three per paragraph: the dataset, model, cohort, decision or option the sentence turns on. Preferred bold lead labels: ${Object.keys(LABEL_ICONS).map(w => w[0]!.toUpperCase() + w.slice(1)).join(', ')}.
- **Keep text that will be copied clean.** No pills, bold color labels or tree shapes in manuscript paragraphs (give those as blockquotes, drawn at full brightness), paths, commands, code, literal output, or anything written to a file.
- **Shape follows information.** \`├──\` and \`└──\` for what belongs to what, \`→\` for a sequence, \`✓\` or \`✗\` beside a checked item.
</reply_style>`
}


const width = (runs: Run[]) => runs.reduce((n, r) => n + [...r.s].length, 0)
const splitRow = (line: string) =>
  line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '').split(/(?<!\\)\|/).map(c => c.trim())
const SEPARATOR = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/

/** A GFM table drawn with the same box lines Claude Code uses, so pills inside it are colored. */
function tableLines(rows: string[][], aligns: string[], set: Settings): Run[][] | undefined {
  const cols = Math.max(...rows.map(r => r.length))
  const cells = rows.map((r, i) =>
    Array.from({ length: cols }, (_, c) => parseInline(r[c] ?? '', set, i === 0 ? { s: '', bold: true } : { s: '' })),
  )
  const widths = Array.from({ length: cols }, (_, c) => Math.max(1, ...cells.map(r => width(r[c]!))))
  const total = widths.reduce((a, b) => a + b + 3, 1)
  if (set.maxWidth && total > set.maxWidth) return undefined
  const rule = (l: string, m: string, r: string): Run[] => [{ s: l + widths.map(w => '─'.repeat(w + 2)).join(m) + r, dim: true }]
  const row = (r: Run[][]): Run[] => {
    const out: Run[] = [{ s: '│', dim: true }]
    r.forEach((cell, c) => {
      const gap = widths[c]! - width(cell)
      const a = aligns[c] ?? 'left'
      const left = a === 'right' ? gap : a === 'center' ? Math.floor(gap / 2) : 0
      out.push({ s: ' ' + ' '.repeat(left) }, ...cell, { s: ' '.repeat(gap - left) + ' ' }, { s: '│', dim: true })
    })
    return out
  }
  return [rule('┌', '┬', '┐'), row(cells[0]!), rule('├', '┼', '┤'), ...cells.slice(1).map(row), rule('└', '┴', '┘')]
}

/** Pull the tables that hold pills out of a Markdown block; the rest stays Markdown. */
function splitTables(text: string, set: Settings): Block[] {
  const lines = text.split('\n')
  const out: Block[] = []
  let md: string[] = []
  let fence: string | undefined
  const flush = () => {
    if (md.length) out.push({ k: 'md', text: md.join('\n') })
    md = []
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const f = line.match(FENCE)
    if (fence !== undefined || f) {
      if (fence === undefined) fence = f![1]
      else if (f && f[1]![0] === fence[0] && line.trim() === f[1]) fence = undefined
      md.push(line)
      continue
    }
    if (TABLE.test(line) && SEPARATOR.test(lines[i + 1] ?? '')) {
      let j = i + 2
      while (j < lines.length && TABLE.test(lines[j]!)) j++
      const group = lines.slice(i, j)
      if (group.some(l => /\[\[[^[\]\n]{1,32}\]\]/.test(l))) {
        const aligns = splitRow(lines[i + 1]!).map(c =>
          c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : 'left',
        )
        const drawn = tableLines([splitRow(group[0]!), ...group.slice(2).map(splitRow)], aligns, set)
        if (drawn) {
          flush()
          out.push({ k: 'lines', lines: drawn })
          i = j - 1
          continue
        }
      }
    }
    md.push(line)
  }
  flush()
  return out
}


/** Upper-case status words agents write in hand-overs, as the pill each becomes. */
const SHOUTED: [RegExp, string][] = [
  [/\bHANDED[ _]OVER\b/g, 'Handed over'],
  [/\bPASSED\b/g, 'Passed'],
  [/\bFAILED\b/g, 'Failed'],
  [/\bCOMPLETED\b/g, 'Completed'],
  [/\bSUBMITTED\b/g, 'Submitted'],
  [/\bRUNNING\b/g, 'Running'],
  [/\bCANCELL?ED\b/g, 'Cancelled'],
  [/\bOOM\b/g, 'OOM'],
  [/\bTIMEOUT\b/g, 'Killed 143'],
  [/\bBLOCKED\b/g, 'Blocked'],
]

/** A message from another agent, read for the summary line and its body. */
export function readAgentMessage(raw: string): { body: string; states: string[] } {
  // Idle notifications are JSON envelopes, one per line or the whole message: keep their
  // `result` (or `summary`) and drop the frames that carry nothing.
  const unwrap = (line: string): string | undefined => {
    const t = line.trim()
    if (!t.startsWith('{')) return line
    try {
      const o = JSON.parse(t) as Record<string, unknown>
      const inner = [o.result, o.summary, o.message, o.content].find(v => typeof v === 'string') as string | undefined
      return inner ?? (o.type === 'idle_notification' ? undefined : line)
    } catch {
      return line
    }
  }
  const whole = unwrap(raw)
  let body = (whole !== undefined && whole !== raw ? whole : raw.split('\n').map(unwrap).filter(l => l !== undefined).join('\n')).trim()
  if (!body) body = 'idle'
  body = body.replace(/^\[[\w.-]+\]\s*/, '')
  const states: string[] = []
  for (const [re, word] of SHOUTED) {
    re.lastIndex = 0
    if (re.test(body) && !states.includes(word)) states.push(word)
  }
  // Inline: shouted words become pills; job ids are bold.
  let marked = body
  for (const [re, word] of SHOUTED) marked = marked.replace(re, `[[${word}]]`)
  marked = marked.replace(/\b([Jj]ob|[Aa]rray)\s+(\d{6,10})\b/g, '$1 **$2**')
  return { body: marked, states }
}

/** A stable hue per sender, so each agent keeps its color. */
export function senderColor(name: string): string {
  const hues: Hue[] = ['cyan', 'violet', 'green', 'amber', 'blue', 'magenta']
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return HUES[hues[h % hues.length]!].fg
}
