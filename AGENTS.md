# Agent notes

## Boundaries

- The plugin never binds keys, edits files outside its own folder, or writes user
  configuration (`~/.config/hypr/`, `shell.json`, `omarchy-menu.jsonc`). Keybinding and menu
  entry are documented in the README for users to add themselves.
- No network access, no `eval()`, no shell commands built from user input. The only external
  command is `wl-copy` with the result as a separate argument.
- Plugin id `io.github.canclini.calculator` is a permanent marketplace identifier; do not rename.

## Code

- `CalcModel.js` is a QML `.pragma library` module. It must stay ES5-compatible (no arrow
  functions, `let`, `BigInt`, `Object.is`, regex lookbehind) because the Quickshell JS engine
  runs it. `test/calc-model.test.js` strips the pragma line and runs it under node.
- Every change to `CalcModel.js` gets a test case; keep the README examples in step with them.

## Checks

- Test: `node test/calc-model.test.js`
- Validate the manifest: `omarchy plugin validate .`
- Reload after edits: `omarchy restart shell` (hot reload keeps stale plugin code).
- `console.log` from the plugin does not reach the journal; use `console.warn` while debugging.
- When driving the overlay with `wtype`, a bare `-` argument makes wtype read stdin; use `wtype -- -`.

## Commits and pull requests

Follow [CONTRIBUTING.md](CONTRIBUTING.md): one change per pull request, an imperative
sentence-case title without a `fix:`/`feat:` prefix, and a `## Verification` section.
