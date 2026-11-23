// Writes reply-style.md from the same word table that draws the pills, so the rules the
// model reads and the drawing cannot drift apart. Run after changing hooks/emphasis.ts:
//   node --experimental-strip-types scripts/build-rules.ts > reply-style.md   (Node 22.6+)
//   bun scripts/build-rules.ts > reply-style.md
import { replyGuidance } from '../hooks/emphasis.ts'

const body = replyGuidance().replace(/^<reply_style>\n/, '').replace(/\n<\/reply_style>$/, '')
console.log(`# Reply style (emphasis)\n\n${body}`)
