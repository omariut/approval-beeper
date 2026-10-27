import type { EngineInterface, Register } from 'claude-code'

// Notifications that mean "Claude is waiting on you".
const WAITING = new Set(['permission_prompt', 'idle_prompt', 'elicitation_dialog'])

// macOS's own Glass sound, played from the system rather than shipped with the plugin.
const GLASS = '/System/Library/Sounds/Glass.aiff'

// One wait can raise several events (a question is both a tool call and a
// notification), so chimes this close together count as one.
const QUIET_MS = 3000
let lastChimeAt = 0

const chime = async ($: EngineInterface) => {
  const now = await $.clock.now()
  if (now - lastChimeAt < QUIET_MS) return
  lastChimeAt = now
  // Never let a missing player or muted output get in the way of the session.
  await $.process.run(['afplay', GLASS], { timeoutMs: 5000 })
}

export const register: Register = on => {
  on('classic.Notification', ($, e, next) => {
    if (WAITING.has(e.notification_type)) chime($).catch(() => {})
    return next(e)
  }).catch(($, e, next) => next(e))

  // A question or a plan to approve needs an answer before Claude goes on.
  on('tool.call', { tool: 'AskUserQuestion' }, ($, e, next) => {
    chime($).catch(() => {})
    return next(e)
  }).catch(($, e, next) => next(e))
  on('tool.call', { tool: 'ExitPlanMode' }, ($, e, next) => {
    chime($).catch(() => {})
    return next(e)
  }).catch(($, e, next) => next(e))
}
