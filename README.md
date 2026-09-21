# Calculator for Omarchy

A quick calculator for the Omarchy shell. Press a key, type a calculation, and the result
appears next to it as you type. `Enter` copies the result to the clipboard and closes.

![The calculator showing (1250 + 8,1%) × 12 = 16215](preview.png)

## Install

Requires **Omarchy 4**. The calculator follows the active Omarchy theme. Copying the result
uses `wl-copy` from `wl-clipboard`, which Omarchy installs by default; there are no other
dependencies.

```bash
omarchy plugin add https://github.com/canclini/omarchy-calculator.git --enable
```

Update it with:

```bash
omarchy plugin update io.github.canclini.calculator
```

## Open it from the keyboard

The plugin does not bind a key on its own. Add this to `~/.config/hypr/bindings.lua`:

```lua
o.bind("SUPER + ALT + C", "Calculator", "omarchy-shell shell toggle io.github.canclini.calculator")
```

To use a different key, change `SUPER + ALT + C` to any free combination, for example
`SUPER + ALT + X`. Check what is already taken with `omarchy menu keybindings --print`.
If the key is used by an Omarchy default, free it first with `hl.unbind("SUPER + ALT + C")`
on the line above. Hyprland reloads the file on save.

To also find it in the Omarchy menu, add this line to
`~/.config/omarchy/extensions/omarchy-menu.jsonc`:

```jsonc
"calculator": {"icon":"󰃬","label":"Calculator","action":"omarchy-shell shell summon io.github.canclini.calculator {}"},
```

## Features

- **Live result:** shown next to the expression while you type; `Enter` copies it and closes.
- **Editing:** move with the arrow keys, `Home` and `End`, select with `Shift`, paste with `Ctrl+V`.
- **Parentheses:** select part of the expression and type `(` to wrap it; deleting a parenthesis also deletes its partner.
- **Percent like a desk calculator:** `200*15%` is `30`, `80+10%` is `88`, `80-25%` is `60`.
- **Functions:** powers `2^10`, roots `sqrt(144)` or `√16`, `round(3,14159; 2)`, `floor`, `ceil`, and `pi`.
- **Local notation:** decimal comma `0,5`, thousands separator `1'000`, and `×` `÷` `−`.
- **Proper signs:** type `3*2` or `3x2` and the field shows `3×2`; `-` becomes `−` and `**` becomes `^`. The result stays plain.
- **Safe:** a small parser evaluates the input; nothing reaches `eval()` or a shell.

![Four calculations: 80 − 25% = 60, sqrt(144) + 2^10 = 1036, 1'299,90 × 3 = 3899.7, round(2pi; 4) = 6.2832](examples.png)

| Type this | Get this |
|---|---|
| `(1+2)*3` | `9` |
| `17%5` | `2` (a `%` followed by a number is the remainder) |
| `2^3^2`, `-2^2` | `512`, `-4` |
| `2√9`, `2pi`, `2(3+4)` | `6`, `6.28318530717959`, `14` |
| `round(2.5)`, `round(1.005; 2)` | `3`, `1.01` |

Separate function arguments with `;` or with `, ` and a space, since `3,14` is a decimal
number. Results always use a decimal point so they paste anywhere.

| Key | Action |
|---|---|
| `Enter` | Copy the result and close |
| `Escape` | Clear the field, press again to close |

## Remove

```bash
omarchy plugin remove io.github.canclini.calculator
```

Then delete the keybinding and menu line you added.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

Licensed under the [MIT License](LICENSE).
