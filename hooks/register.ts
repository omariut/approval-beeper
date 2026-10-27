import type { EngineInterface, Register } from 'claude-code'

// Notifications that mean "Claude is waiting on you".
const WAITING = new Set(['permission_prompt', 'idle_prompt', 'elicitation_dialog'])

// macOS's own Glass sound, played from the system rather than shipped with the plugin.
const GLASS = '/System/Library/Sounds/Glass.aiff'

// Tools that stop and wait for the person's answer.
const ASKS = ['AskUserQuestion', 'ExitPlanMode'] as const

// One wait can raise several events, some seconds apart (a question is a tool
// call, then a notification while it sits unanswered). Chime when a wait
// starts, then stay quiet until the person answers.
let isWaiting = false

const chime = ($: EngineInterface) => {
  if (isWaiting) return
  isWaiting = true
  // Never let a missing player or muted output get in the way of the session.
  $.process.run(['afplay', GLASS], { timeoutMs: 5000 }).catch(() => {})
}

const answered = () => {
  isWaiting = false
}

export const register: Register = on => {
  on('classic.Notification', ($, e, next) => {
    if (WAITING.has(e.notification_type)) chime($)
    return next(e)
  }).catch(($, e, next) => next(e))

  // A question or a plan to approve needs an answer before Claude goes on;
  // the call returns once it has one.
  on('tool.call', { tool: 'AskUserQuestion' }, async ($, e, next) => {
    chime($)
    try {
      return await next(e)
    } finally {
      answered()
    }
  }).catch(($, e, next) => next(e))
  on('tool.call', { tool: 'ExitPlanMode' }, async ($, e, next) => {
    chime($)
    try {
      return await next(e)
    } finally {
      answered()
    }
  }).catch(($, e, next) => next(e))

  // Sending a message or Claude starting work again ends any wait.
  on('prompt.submit', ($, e, next) => {
    answered()
    return next(e)
  }).catch(($, e, next) => next(e))
  on('tool.call', ($, e, next) => {
    if (!(ASKS as readonly string[]).includes(e.tool)) answered()
    return next(e)
  }).catch(($, e, next) => next(e))
}
