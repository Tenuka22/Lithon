# Zed Lithon

Syntax highlighting for the Lithon programming language (`.lio` files)
in the [Zed](https://zed.dev) editor, via the tree-sitter grammar in
`grammars/lithon/` (grammar + scanner compile to `src/parser.c` during
generation by `tree-sitter generate`).

## Install — quickest path (folder)

1. Ensure a Zed-supported language id on your machine:
   `zed --version`.
2. Copy the two needed folders:

   ```bash
   cp -r editors/zed-lithon/grammars/lithon ~/.config/zed/languages/lithon  # grammar package
   cp -r editors/zed-lithon/languages/lithon ~/.config/zed/languages/lithon-lang || true
   ```

   Hmm — simplest reliable route used in CI/testing here is a local
   clone; Zed users commonly symlink:

   ```bash
   mkdir -p ~/.config/zed/languages
   ln -s "$PWD/editors/zed-lithon" ~/.config/zed/extensions/zed-lithon
   ```

   Then open any `.lio` file — it highlights.

## Install — proper extension (recommended)

Add this folder as a Zed extension:

```bash
zed extension install editors/zed-lithon
```

or, in the Zed UI:

Settings > Extensions > "Install Dev Extension…" and point it at
`editors/zed-lithon`.

## What is highlighted

- comments (`# ...`)
- strings + f-strings
- numbers (int/float, hex `0x...`)
- keywords: `class`, `def`, `return`, `if`, `elif`, `else`, `while`, `for`,
  `in`, `break`, `continue`, `match`, `case`, `try`, `except`, `finally`,
  `as`, `is`, `and`, `or`, `not`
- builtins: `print`, `len`, `range`, `addressof`, `valueof`, `wrap_add`,
  `wrap_sub`, `wrap_mul`, `syscall`, `isinstance`, `issubclass`,
  `min`, `max`, `any`, `all`, `sum`, `abs`, `contains`, `enumerate`, `zip`
- types: `int[...]`, `float[64]`, `bool`, `str[...]`, `list[...]`,
  `dict[...]`, `tuple[...]`, `ptr[...]`, plus `struct`, `enum`, `newtype`
- operators (`+`, `<<`, `>>`, `&`, `%`, `**`, `//`-style, comparisons,
  augmented assignments), `->`, `@` decorators
- function/method names, class names, `@property`/`@classmethod` decorators

## Known limitations

Highlighting-focused grammar: suites are greedy statement runs
(indentation ignored), so deep structural nesting degrades in the tree
shape. Lexical highlighting (keywords/types/strings) is unaffected.
Strict nesting via an external scanner is a planned refinement.

## Regenerate the parser (after grammar edits)

```bash
cd editors/zed-lithon/grammars/lithon
tree-sitter generate    # writes src/parser.c from grammar.js
tree-sitter build       # compiles src/parser.c + src/scanner.c
# Updating highlights only (no grammar change): edit queries/highlights.scm
# and run `zed --reload-languages` (or restart Zed).
```
