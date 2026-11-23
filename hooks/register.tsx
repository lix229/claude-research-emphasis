import type { Register } from 'claude-code'

import { REMINDER, groupLinks, parseBlocks, parseInline, pillRuns, readAgentMessage, senderColor, type IconSet, type Run, type Settings } from './emphasis'

/** The Claude Code theme's name, read once from the /config rows and kept current by config.set. */
let themeName: string | undefined

async function readTheme($: { config: { list: () => Promise<readonly { key: string; value: unknown }[]> } }): Promise<string> {
  if (themeName === undefined) {
    try {
      const row = (await $.config.list()).find(r => r.key === 'theme')
      themeName = typeof row?.value === 'string' ? row.value : ''
    } catch {
      themeName = ''
    }
  }
  return themeName
}

export const register: Register = (on, options) => {
  const icons: IconSet = options.icons === 'nerd-font' || options.icons === 'none' ? options.icons : 'unicode'
  const settings: Settings = {
    icons,
    boldColor: typeof options.boldColor === 'string' ? options.boldColor.trim() : '',
  }

  // Palette: a fixed choice, or (auto) one that follows the Claude Code theme. Light themes get the
  // light colors; colorblind (daltonized) and terminal-palette (ANSI) themes get the theme's own colors.
  const chosen = options.palette === 'bright' ? 'theme' : options.palette
  const fixed = chosen === 'dark' || chosen === 'light' || chosen === 'theme' ? chosen : undefined
  const paletteFor = (theme: string): 'dark' | 'light' | 'theme' =>
    fixed ?? (/ansi|daltonized/.test(theme) ? 'theme' : theme.startsWith('light') ? 'light' : 'dark')
  // A one-line reminder of the rules rides with each message the user types, so they stay in view in long
  // sessions (the full rules come from CLAUDE.md once, at the start). Off with the reminder option.
  if (options.reminder !== false) {
    on('prompt.submit', async ($, e, next) => {
      const kind = e.origin?.kind
      if (kind !== 'composer' && kind !== 'bridge') return next(e)
      return next({ ...e, context: [...(e.context ?? []), REMINDER] })
    })
  }

  on('config.set', { key: 'theme' }, async ($, e, next) => {
    const result = await next(e)
    if (typeof e.value === 'string') themeName = e.value
    return result
  })
  // Messages from teammates, subagents and other sessions, and background-task notifications:
  // a colored sender, the states the message reports as pills, and the head of the body.
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const { from, task, origin, isExpanded, text } = e.props
    const isTask = origin.kind === 'task-notification'
    if ((!from && !isTask) || isExpanded) return next(e)
    const { Box, Text, Link } = $.ui.resolve(e)
    const set: Settings = { ...settings, palette: paletteFor(fixed ? '' : await readTheme($)) }
    const name = from?.name ?? (task?.type ? task.type.replace(/_/g, ' ') : 'background task')
    const { body, states } = readAgentMessage(text)
    if (task?.status) {
      const word = task.status === 'completed' ? 'Completed' : task.status === 'failed' ? 'Failed' : task.status === 'killed' ? 'Cancelled' : task.status
      if (!states.includes(word)) states.unshift(word)
    }
    const one = (r: Run) => (
      <Text color={r.color} backgroundColor={r.bg} bold={r.bold} italic={r.italic} underline={r.underline} dimColor={r.dim}>
        {r.s}
      </Text>
    )
    // A link is a real hyperlink (OSC 8); where the terminal has none, Claude Code prints the address after it.
    // A bare address is its own label, so it is drawn label-less and printed once.
    const paint = (rs: Run[]) =>
      groupLinks(rs).map(p =>
        !('href' in p) ? one(p.run) : p.runs.map(x => x.s).join('') === p.href ? <Link href={p.href} /> : <Link href={p.href}>{p.runs.map(one)}</Link>,
      )
    const lines = body.split('\n').map(l => l.trim()).filter(Boolean)
    const head = lines.slice(0, 3)
    return (
      <Box flexDirection="column">
        <Text>
          <Text color={senderColor(name, set)}>{'◆ '}</Text>
          <Text bold>{name}</Text>
          {states.slice(0, 4).flatMap(w => [<Text> </Text>, ...paint(pillRuns(w, set))])}
        </Text>
        {head.map(l => (
          <Box flexDirection="row">
            <Text color={senderColor(name, set)}>{'  │ '}</Text>
            <Text>{paint(parseInline(l, set))}</Text>
          </Box>
        ))}
        {lines.length > head.length ? (
          <Text dimColor>{`  └ ${lines.length - head.length} more ${lines.length - head.length === 1 ? 'line' : 'lines'} · ctrl+o to expand`}</Text>
        ) : null}
      </Box>
    )
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.props.isSummary) return next(e)
    const cols = e.viewport?.columns
    const set: Settings = { ...settings, palette: paletteFor(fixed ? '' : await readTheme($)) }
    const blocks = parseBlocks(e.props.text, cols ? { ...set, maxWidth: cols - 4 } : set)
    if (blocks.every(b => b.k === 'md' || b.k === 'blank')) return next(e)

    const { Box, Text, Markdown, Link } = $.ui.resolve(e)

    const one = (r: Run) => (
      <Text color={r.color} backgroundColor={r.bg} bold={r.bold} italic={r.italic} underline={r.underline} dimColor={r.dim}>
        {r.s}
      </Text>
    )
    // A link is a real hyperlink (OSC 8); where the terminal has none, Claude Code prints the address after it.
    // A bare address is its own label, so it is drawn label-less and printed once.
    const runs = (rs: Run[]) =>
      groupLinks(rs).map(p =>
        !('href' in p) ? one(p.run) : p.runs.map(x => x.s).join('') === p.href ? <Link href={p.href} /> : <Link href={p.href}>{p.runs.map(one)}</Link>,
      )

    // A quote or ask box brings its own empty row above and below, so the blank line next to it is dropped.
    const boxed = (b?: { k: string }) => b?.k === 'quote' || b?.k === 'ask'
    const shown = blocks.filter((b, i) => !(b.k === 'blank' && (boxed(blocks[i - 1]) || boxed(blocks[i + 1]))))
    const body = shown.map(b => {
      switch (b.k) {
        case 'md':
          return <Markdown text={b.text} />
        case 'lines':
          return (
            <Box flexDirection="column">
              {b.lines.map(l => (
                <Text wrap="truncate-end">{runs(l)}</Text>
              ))}
            </Box>
          )
        case 'blank':
          return <Text> </Text>
        case 'heading':
          return (
            <Box flexDirection="row">
              <Text color="claude">{b.level <= 2 ? '▍ ' : '› '}</Text>
              <Text bold>{runs(b.runs)}</Text>
            </Box>
          )
        case 'quote':
          // A dim bar on every wrapped line; the orange bar is for headings only.
          return (
            <Box borderStyle="quote" borderDimColor paddingLeft={1}>
              <Text>{runs(b.runs)}</Text>
            </Box>
          )
        case 'ask':
          // The ask stands apart: an amber bar beside every line of it.
          return (
            <Box borderStyle="quote" borderColor={b.bar} paddingLeft={1}>
              <Text>{runs(b.runs)}</Text>
            </Box>
          )
        case 'brief':
          // The kind of work sits in the card's top border, so the card spends no row on it.
          return (
            <Box flexDirection="column">
              <Box flexDirection="column" borderStyle="round" borderColor={b.border} paddingX={1}>
                <Text>{runs(b.runs)}</Text>
              </Box>
              <Box position="absolute" top={0} left={2}>
                <Text>{runs(b.title)}</Text>
              </Box>
            </Box>
          )
        case 'item':
          return (
            <Box flexDirection="row">
              <Text dimColor>{' '.repeat(b.indent) + b.marker + ' '}</Text>
              <Text>{runs(b.runs)}</Text>
            </Box>
          )
        case 'para':
          return <Text>{runs(b.runs)}</Text>
      }
    })

    if (!e.props.isFirstOfReply) return <Box flexDirection="column">{body}</Box>
    return (
      <Box flexDirection="row">
        <Text>⏺ </Text>
        <Box flexDirection="column" flexShrink={1}>
          {body}
        </Box>
      </Box>
    )
  })
}
