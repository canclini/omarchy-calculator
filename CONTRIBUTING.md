# Contributing

There is no issue tracker here. A bug report asks somebody else to reproduce a problem and
find the time to fix it; a pull request is the same information with the answer already in
it. Coding agents make that a fair thing to ask: point Codex, Claude Code, or whatever you
use at this checkout, describe what went wrong, and let it read the code. The working notes
it needs are in [AGENTS.md](AGENTS.md).

## You found a bug

1. Reproduce it and write down the smallest input that shows it, for example `80-25%`.
2. Fix it and add a case to `test/calc-model.test.js` that fails without the fix.
3. Open a pull request whose body contains the reproduction.

**If you cannot fix it**, open a draft pull request that adds only the failing test case.

**Security problems are the exception.** Report them privately through *Report a
vulnerability* on the repository's Security tab before publishing anything.

## Project boundary

The plugin is one overlay: an expression goes in, a number goes to the clipboard. It does
not bind keys, edit user configuration, or install anything outside its plugin folder;
the README tells users which lines to add themselves.

New syntax is welcome when it is what people type into a calculator. Unit conversion,
currency rates, history, or anything that needs the network belongs in a different plugin.

## Run it

Link your checkout into the shell and enable it:

```bash
ln -s "$PWD" ~/.config/omarchy/plugins/io.github.canclini.calculator
omarchy plugin enable io.github.canclini.calculator
omarchy-shell shell toggle io.github.canclini.calculator
```

After every change run `omarchy restart shell`. The shell's hot reload reports that it
reloaded the plugin but can keep running the old code.

## Checks

```bash
node test/calc-model.test.js    # evaluator and parenthesis editing, no shell needed
omarchy plugin validate .       # manifest
```

Both have to pass before you open the pull request. Nothing in CI runs them for you.

| What you changed | What to do |
|---|---|
| Parsing, percent rules, functions, formatting in `CalcModel.js` | Add cases to `test/calc-model.test.js` and update the README table |
| Keys, focus, layout in `Calculator.qml` | Drive it by hand in a light and a dark theme and add a screenshot to the pull request |

`CalcModel.js` runs inside the Quickshell JavaScript engine, so keep it to ES5: no arrow
functions, `let`, `BigInt`, or regex lookbehind.

## The pull request

**One change per pull request.** A refactor next to a bug fix makes both harder to review.

**The title is the commit message.** Write one imperative sentence, sentence case, no
`fix:` or `feat:` prefix, naming what is different afterwards:

```
Treat a percent after a closing parenthesis as a percentage
Accept a non-breaking space as thousands separator
```

**The body says what was wrong and why this is the fix**, followed by:

```markdown
## Verification

`node test/calc-model.test.js` green; the new case fails without the change.
Driven by hand in the Catppuccin and Catppuccin Latte themes.
```

If an agent wrote the patch, you are still its author: read the diff before you send it and
be able to explain every line.
