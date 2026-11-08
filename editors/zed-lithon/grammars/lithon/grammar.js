/**
 * Tree-sitter grammar for Lithon — highlighting-focused (Python-shaped,
 * fixed-width types). Suites are greedy runs of following statements
 * (indentation ignored): exact nesting degrades, but every real Lithon
 * file parses and its lexemes highlight reliably. Strict nesting via
 * an external scanner is a documented future refinement.
 */

function commaSep(rule) {
  return seq(rule, repeat(seq(",", rule)));
}
function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

module.exports = grammar({
  name: "lithon",

  extras: ($ => [/\s/, $.comment]),

  conflicts: ($ => [
    [$.return_statement],
    [$.call_expression],
    [$.suite],
    [$.if_statement],
    [$.while_statement],
    [$.for_statement],
    [$.try_statement],
    [$.match_statement],
    [$.expression_statement, $.primary_expression],
    [$.type_annotation, $.type_identifier],
  ]),

  word: ($ => $.identifier),

  rules: {
    file: ($ => repeat($.statement)),

    statement: ($) => choice(
      $.decorated_definition,
      $.function_definition,
      $.class_definition,
      $.if_statement,
      $.for_statement,
      $.while_statement,
      $.try_statement,
      $.match_statement,
      $.return_statement,
      $.break_statement,
      $.continue_statement,
      $.assignment,
      $.augmented_assignment,
      $.expression_statement,
    ),

    expression_statement: ($) => choice(
      $.call_expression,
      $.identifier,
    ),

    decorated_definition: ($) => seq(
      repeat1($.decorator),
      choice($.function_definition, $.class_definition),
    ),

    decorator: ($) => seq(
      "@",
      $.dotted_name,
      optional($.argument_list),
    ),

    function_definition: ($) => seq(
      "def",
      field("name", $.identifier),
      "(",
      optional(commaSep($.parameter)),
      ")",
      optional(seq("->", $.type_annotation)),
      ":",
      $.suite,
    ),

    class_definition: ($) => seq(
      "class",
      field("name", $.type_identifier),
      optional(seq("(", commaSep($.type_identifier), ")")),
      ":",
      $.suite,
    ),

    parameter: ($) => seq(
      field("name", $.identifier),
      optional(seq(":", $.type_annotation)),
      optional($.default_parameter),
    ),

    default_parameter: ($) => seq("=", $.expression),

    if_statement: ($) => seq(
      "if", $.expression, ":", $.suite,
      repeat(seq("elif", $.expression, ":", $.suite)),
      optional(seq("else", ":", $.suite)),
    ),

    for_statement: ($) => seq(
      "for", commaSep1($.identifier), "in", $.expression, ":",
      $.suite,
      optional(seq("else", ":", $.suite)),
    ),

    while_statement: ($) => seq(
      "while", $.expression, ":", $.suite,
      optional(seq("else", ":", $.suite)),
    ),

    try_statement: ($) => seq(
      "try", ":", $.suite,
      repeat1(choice($.except_clause, $.else_clause, $.finally_clause)),
    ),

    except_clause: ($) => seq(
      "except",
      optional(choice(
        seq(optional("as"), $.identifier),
        $.dotted_name,
      )),
      ":", $.suite,
    ),

    else_clause: ($) => seq("else", ":", $.suite),

    finally_clause: ($) => seq("finally", ":", $.suite),

    match_statement: ($) => seq(
      "match", $.expression, ":",
      $.match_case,
      repeat($.match_case),
    ),

    match_case: ($) => seq(
      "case", commaSep($.expression), ":", $.suite,
    ),

    return_statement: ($) => seq("return", optional($.expression)),

    break_statement: ($) => "break",

    continue_statement: ($) => "continue",

    assignment: ($) => seq(
      commaSep1($.identifier),
      optional(seq(":", $.type_annotation)),
      repeat1(seq("=", $.expression)),
    ),

    augmented_assignment: ($) => seq(
      $.identifier,
      choice("+=", "-=", "*=", "/=", "%=", "^=", "&=", "|=", "<<=", ">>="),
      $.expression,
    ),

    suite: ($) => seq(":", repeat1($.statement)),

    // ---- types --------------------------------------------------------

    type_annotation: ($) => choice(
      $.generic_type,
      $.type_identifier,
      "self",
    ),

    generic_type: ($) => prec(2, seq(
      choice(
        "int", "float", "bool", "str", "list", "dict", "tuple",
        "ptr", "newtype", "struct", "enum", "object",
      ),
      optional($.subscript_type),
    )),

    subscript_type: ($) => seq(
      "[",
      commaSep(choice($.type_annotation, $.integer, $.float, $.identifier)),
      "]",
    ),

    type_identifier: ($) => /[A-Z][A-Za-z0-9_]*|_?[a-z][a-zA-Z0-9_]*/,

    // ---- expressions --------------------------------------------------

    expression: ($) => choice(
      $.binary_expression,
      $.boolean_operator,
      $.comparison_expression,
      $.primary_expression,
    ),

    primary_expression: ($) => choice(
      $.unary_expression,
      $.call_expression,
      $.identifier,
      $.parenthesized_expression,
      $.string,
      $.number,
      "True",
      "False",
      "self",
    ),

    call_expression: ($) => seq(
      $.dotted_name,
      $.argument_list,
    ),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    binary_expression: ($) => prec.left(1, seq(
      $.expression, choice(
        "**", "*", "/", "+", "-", "<<", ">>", "%", "^", "&", "|",
      ), $.expression,
    )),

    unary_expression: ($) => seq(choice("-", "+", "~", "not"), $.expression),

    boolean_operator: ($) => prec.left(1, seq(
      $.expression, choice("and", "or"), $.expression,
    )),

    comparison_expression: ($) => prec.left(2, seq(
      $.expression, choice(
        "==", "!=", "<=", ">=", "<", ">", "is", "is not",
      ), $.expression,
    )),

    dotted_name: ($) => seq($.identifier, repeat1(seq(".", $.identifier))),

    argument_list: ($) => seq("(", commaSep($.expression), ")"),

    // ---- lexical ----------------------------------------------------

    comment: ($) => token(prec(-1, /#[^\r\n]*/)),

    identifier: ($) => /_?[a-zA-Z][a-zA-Z0-9_]*/,

    number: ($) => choice($.integer, $.float),

    integer: ($) => /0x[0-9a-fA-F_]+|[0-9][0-9_]*/,

    float: ($) => /[0-9][0-9_]*\.[0-9_]*([eE][+-]?[0-9]+)?/,

    string: ($) => choice(
      token(/f"(\\.|[^"\\\r\n])*"/),
      token(/"(\\.|[^"\\\r\n])*"/),
      token(/'(\\.|[^'\\\r\n])*'/),
    ),
  },
});
