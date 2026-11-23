import type { Register } from 'claude-code'

import { parseBlocks, parseInline, pillRuns, readAgentMessage, senderColor, type IconSet, type Run, type Settings } from './emphasis'

export const register: Register = (on, options) => {
  const icons: IconSet = options.icons === 'nerd-font' || options.icons === 'none' ? options.icons : 'unicode'
  const settings: Settings = {
    icons,
    boldColor: typeof options.boldColor === 'string' ? options.boldColor.trim() : 'suggestion',
    palette: options.palette === 'bright' ? 'bright' : 'tinted',
  }
  // Messages from teammates, subagents and other sessions, and background-task notifications:
  // a colored sender, the states the message reports as pills, and the head of the body.
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const { from, task, origin, isExpanded, text } = e.props
    const isTask = origin.kind === 'task-notification'
    if ((!from && !isTask) || isExpanded) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const name = from?.name ?? (task?.type ? task.type.replace(/_/g, ' ') : 'background task')
    const { body, states } = readAgentMessage(text)
    if (task?.status) {
      const word = task.status === 'completed' ? 'Completed' : task.status === 'failed' ? 'Failed' : task.status === 'killed' ? 'Cancelled' : task.status
      if (!states.includes(word)) states.unshift(word)
    }
    const paint = (rs: Run[]) =>
      rs.map(r => (
        <Text color={r.color} backgroundColor={r.bg} bold={r.bold} italic={r.italic} underline={r.underline} dimColor={r.dim}>
          {r.s}
        </Text>
      ))
    const lines = body.split('\n').map(l => l.trim()).filter(Boolean)
    const head = lines.slice(0, 3)
    return (
      <Box flexDirection="column">
        <Text>
          <Text color={senderColor(name)} bold>
            {'◆ ' + name}
          </Text>
          {states.slice(0, 4).flatMap(w => [<Text> </Text>, ...paint(pillRuns(w, settings))])}
        </Text>
        {head.map(l => (
          <Box flexDirection="row">
            <Text dimColor>{'  │ '}</Text>
            <Text wrap="truncate-end">{paint(parseInline(l, settings))}</Text>
          </Box>
        ))}
        {lines.length > head.length ? <Text dimColor>{`  └ ${lines.length - head.length} more lines · ctrl+o`}</Text> : null}
      </Box>
    )
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.props.isSummary) return next(e)
    const cols = e.viewport?.columns
    const blocks = parseBlocks(e.props.text, cols ? { ...settings, maxWidth: cols - 4 } : settings)
    if (blocks.every(b => b.k === 'md' || b.k === 'blank')) return next(e)

    const { Box, Text, Markdown } = $.ui.resolve(e)

    const runs = (rs: Run[]) =>
      rs.map(r => (
        <Text
          color={r.color}
          backgroundColor={r.bg}
          bold={r.bold}
          italic={r.italic}
          underline={r.underline}
          dimColor={r.dim}
        >
          {r.s}
        </Text>
      ))

    const body = blocks.map(b => {
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
          return (
            <Box flexDirection="row">
              <Text color="claude">▎ </Text>
              <Text>{runs(b.runs)}</Text>
            </Box>
          )
        case 'brief':
          return (
            <Box flexDirection="column" borderStyle="round" borderColor={b.border} paddingX={1}>
              <Text>{runs(b.mode)}</Text>
              <Text>{runs(b.runs)}</Text>
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
