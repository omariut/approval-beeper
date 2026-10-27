# approval-beeper

A Claude Code plugin that plays the macOS **Glass** sound whenever Claude is waiting on you, so you can work in another window and come back only when you're needed.

## When it plays

| Moment | What triggers it |
|---|---|
| Claude asks for **permission** to run a tool or command | `Notification` with type `permission_prompt` |
| Claude has **finished** and is waiting for your next message | `Notification` with type `idle_prompt` |
| An MCP server asks you for input | `Notification` with type `elicitation_dialog` |
| Claude asks you a **question** | the `AskUserQuestion` tool |
| Claude wants a **plan approved** | the `ExitPlanMode` tool |

It never plays during normal work (reading files, running commands, editing). It only plays when Claude can't continue without you.

## Requirements

- **macOS**: the sound is played with the built-in `afplay` and `/System/Library/Sounds/Glass.aiff`. On Linux and Windows the plugin loads but stays silent.
- **Claude Code** 2.1.275 or later.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install approval-beeper --marketplace omariut/approval-beeper
```

Answer `y` to add the marketplace, then pick **user** scope so it works in every project. Restart Claude Code and you're done.

Or from a shell:

```bash
claude plugin marketplace add omariut/approval-beeper
claude plugin install approval-beeper@approval-beeper
```

## Test it

Ask Claude something that needs an answer from you, for example:

> Ask me a yes/no question using the question tool.

You should hear Glass as soon as the question appears, even if the terminal is in the background.

## Change the sound

Edit `GLASS` in `hooks/register.ts` to any file in `/System/Library/Sounds/`:

`Basso`, `Blow`, `Bottle`, `Frog`, `Funk`, `Glass`, `Hero`, `Morse`, `Ping`, `Pop`, `Purr`, `Sosumi`, `Submarine`, `Tink`

```ts
const GLASS = '/System/Library/Sounds/Ping.aiff'
```

Any `.aiff`, `.wav`, `.mp3` or `.m4a` path works too.

## Turn it off or uninstall

- **Pause it:** `/plugin` → `approval-beeper` → **Disable**
- **Remove it:** `claude plugin uninstall approval-beeper@approval-beeper`

## How it works

The whole plugin is one small hooks module, [`hooks/register.ts`](hooks/register.ts):

- A `classic.Notification` hook plays the sound when the notification type is one that means "waiting on you".
- Two `tool.call` hooks play it just before `AskUserQuestion` and `ExitPlanMode` run.
- It chimes **once per wait**: when a wait starts it plays, then stays quiet (even if Claude Code raises more notifications for the same wait) until you answer, send a message, or Claude starts working again.
- The sound runs in the background with `afplay`. Every hook passes the event straight through (`next(e)`), and any failure is swallowed, so the plugin can never block, slow down or change what Claude does.

The plugin does not bundle Apple's sound file. It plays the copy already on your Mac.

## Troubleshooting

| Problem | Fix |
|---|---|
| No sound at all | Check your Mac isn't muted, and run `afplay /System/Library/Sounds/Glass.aiff` in a terminal to confirm audio works. |
| Still no sound | Run `/plugin` and make sure `approval-beeper` is enabled, then restart Claude Code. |
| Sound plays **twice** | You also have a beep hook in `~/.claude/settings.json` (or another sound plugin). Remove one of them. |
| No sound for permission prompts | In auto mode most actions are approved without a prompt, so there's nothing to beep for. Questions and idle still chime. |

## License

[MIT](LICENSE)
