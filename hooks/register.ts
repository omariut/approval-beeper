import type { EngineInterface, Register } from 'claude-code'

// Notifications that mean "Claude is waiting on you".
const WAITING = new Set(['permission_prompt', 'idle_prompt', 'elicitation_dialog'])

// macOS's own Glass sound, played from the system rather than shipped with the plugin.
const GLASS = '/System/Library/Sounds/Glass.aiff'

const chime = ($: EngineInterface) => {
  // Never let a missing player or muted output get in the way of the session.
  $.process.run(['afplay', GLASS], { timeoutMs: 5000 }).catch(() => {})
}

export const register: Register = on => {
  on('classic.Notification', ($, e, next) => {
    if (WAITING.has(e.notification_type)) chime($)
    return next(e)
  }).catch(($, e, next) => next(e))

  // A question or a plan to approve needs an answer before Claude goes on.
  on('tool.call', { tool: 'AskUserQuestion' }, ($, e, next) => {
    chime($)
    return next(e)
  }).catch(($, e, next) => next(e))
  on('tool.call', { tool: 'ExitPlanMode' }, ($, e, next) => {
    chime($)
    return next(e)
  }).catch(($, e, next) => next(e))
}
