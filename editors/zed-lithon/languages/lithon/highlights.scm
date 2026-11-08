; Lithon highlight queries (Zed captures).
; Ordering matters: earlier patterns win, so more specific captures come first.

(comment) @comment

(string) @string

(integer) @number
(float) @number

(identifier) @variable

(function_definition name: (identifier) @function)
(call_expression (dotted_name (identifier) @function))
(dotted_name (identifier) @variable.parameter)
(decorator) @attribute
(assignment) @variable

(class_definition name: (type_identifier) @type)
(type_identifier) @type
(generic_type) @type
(parameter name: (identifier) @variable.parameter)

[
  "class" "def" "return" "if" "elif" "else" "while" "for" "in"
  "break" "continue" "match" "case" "try" "except" "finally" "as"
  "is" "and" "or" "not"
] @keyword.operator

("->" @operator)

[
  ("+" @operator)
  ("-" @operator)
  ("*" @operator)
  ("/" @operator)
  ("%" @operator)
  ("**" @operator)
  ("<<" @operator)
  (">>" @operator)
  ("&" @operator)
  ("|" @operator)
  ("^" @operator)
  ("~" @operator)
  ("==" @operator)
  ("!=" @operator)
  ("<=" @operator)
  (">=" @operator)
  ("<" @operator)
  (">" @operator)
  ("+=" @operator)
  ("-=" @operator)
  ("*=" @operator)
  ("/=" @operator)
  ("%=" @operator)
  ("^=" @operator)
  ("&=" @operator)
  ("|=" @operator)
  ("<<=" @operator)
  (">>=" @operator)
  ("=" @operator)
]

[
  "(" @punctuation.bracket
  ")" @punctuation.bracket
  "[" @punctuation.bracket
  "]" @punctuation.bracket
  "{" @punctuation.bracket
  "}" @punctuation.bracket
  "," @punctuation.delimiter
  ":" @punctuation.delimiter
  "@" @punctuation.delimiter
]
