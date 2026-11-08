/**
 * Tree-sitter grammar for Lithon — highlighting-focused (Python-shaped,
 * fixed-width types).
 *
 * Suites are greedy runs of following statements (indentation ignored):
 * exact nesting degrades, but every real Lithon file parses and its
 * lexemes highlight reliably. Strict nesting via an external scanner
 * is a documented future refinement.
 */

// tree-sitter 0.26 no longer injects these helpers
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
    [$.conditional_expression],
    [$.return_statement, $.conditional_expression],
    [$.conditional_expression, $.unary_expression],
    [$.conditional_expression, $.binary_expression],
    [$.conditional_expression, $.boolean_operator],
    [$.conditional_expression, $.comparison_expression],
    [$.assignment, $.conditional_expression],
    [$.augmented_assignment, $.conditional_expression],
    [$.match_statement, $.assignment],
    [$.type_call, $.call_expression],
    [$.dotted_name],
    [$.call_expression, $.subscript_expression],
    [$.primary_expression, $.subscript_expression],
    [$.subscript_expression, $.dotted_name],
    [$.expression_statement, $.assignment, $.subscript_expression],
    [$.assignment, $.subscript_expression],
    [$.suite],
    [$.if_statement],
    [$.while_statement],
    [$.for_statement],
    [$.try_statement],
    [$.match_statement],
    [$.expression_statement, $.primary_expression],
    [$.expression_statement, $.assignment],
    [$.call_expression, $.primary_expression],
  ]),

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
      $.type_identifier,
      "...",
    ),

    decorated_definition: ($) => seq(
      repeat1($.decorator),
      choice($.function_definition, $.class_definition),
    ),

    decorator: ($) => seq(
      "@",
      choice($.dotted_name, $.identifier),
      optional($.argument_list),
    ),

    function_definition: ($) => seq(
      "def",
      field("name", $.identifier),
      "(",
      optional(seq(commaSep($.parameter), optional(","))),
      ")",
      optional(seq("->", $.type_annotation)),
      ":",
      $.suite,
    ),

    class_definition: ($) => seq(
      "class",
      field("name", $.type_identifier),
      optional(seq("(", commaSep(choice($.type_identifier, $.identifier, "struct", "enum", "object")), ")")),
      ":",
      $.suite,
    ),

    parameter: ($) => seq(
      field("name", $.identifier),
      optional(seq(":", $.type_annotation)),
      optional(seq("=", $.expression)),
    ),

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
        $.type_identifier,
        seq("(", commaSep(choice($.type_identifier, $.dotted_name)), ")"),
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
      commaSep1(choice($.identifier, $.type_identifier, $.dotted_name, $.call_expression, $.subscript_expression, "match")),
      optional(seq(":", $.type_annotation)),
      optional(seq("=", $.expression)),
    ),

    augmented_assignment: ($) => seq(
      choice($.identifier, $.dotted_name, $.subscript_expression),
      choice("+=", "-=", "*=", "/=", "%=", "^=", "&=", "|=", "<<=", ">>="),
      $.expression,
    ),

    suite: ($) => repeat1($.statement),

    // ---- types --------------------------------------------------------

    type_annotation: ($) => choice(
      $.generic_type,
      $.type_call,
      $.type_identifier,
      "self",
    ),

    type_call: ($) => seq(
      $.type_identifier,
      "(",
      optional(seq(
        commaSep(choice($.type_annotation, $.integer, $.float, $.identifier)),
        optional(","),
      )),
      ")",
    ),

    generic_type: ($) => seq(
      choice(
        "int", "float", "bool", "str", "list", "dict", "tuple",
        "ptr", "newtype", "struct", "enum", "object",
      ),
      optional($.subscript_type),
    ),

    subscript_type: ($) => seq(
      "[",
      commaSep(choice($.type_annotation, $.integer, $.float, $.identifier)),
      "]",
    ),

    type_identifier: ($) => /[A-Z][A-Za-z0-9_]*/,  // builtins True/False are handled by $.boolean

    // ---- expressions --------------------------------------------------

    expression: ($) => choice(
      $.conditional_expression,
      $.binary_expression,
      $.boolean_operator,
      $.comparison_expression,
      $.primary_expression,
    ),

    conditional_expression: ($) => prec.right(seq(
      $.expression, "if", $.expression, "else", $.expression,
    )),

    primary_expression: ($) => choice(
      $.unary_expression,
      $.call_expression,
      $.dotted_name,
      $.subscript_expression,
      $.type_identifier,
      "match",
      $.identifier,
      $.parenthesized_expression,
      $.list,
      $.dictionary,
      $.set,
      $.string,
      $.number,
      $.boolean,
      "self",
    ),

    boolean: ($) => token(prec(20, choice("True", "False"))),

    list: ($) => seq("[", commaSep($.expression), "]"),

    dictionary: ($) => seq("{", commaSep($.pair), "}"),

    set: ($) => seq("{", commaSep($.expression), "}"),

    pair: ($) => seq($.expression, ":", $.expression),

    call_expression: ($) => seq(
      choice($.dotted_name, $.identifier, $.type_identifier),
      $.argument_list,
      repeat(choice(
        seq(".", $.identifier),
        $.argument_list,
      )),
    ),

    subscript_expression: ($) => prec.left(seq(
      choice($.identifier, $.dotted_name, $.call_expression, $.subscript_expression),
      repeat1(choice($.subscript, seq(".", $.identifier), $.argument_list)),
    )),

    subscript: ($) => seq(
      "[",
      commaSep(choice($.expression, "*")),
      "]",
    ),

    parenthesized_expression: ($) => seq(
      "(",
      commaSep1($.expression),
      optional(","),
      ")",
    ),

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
        "==", "!=", "<=", ">=", "<", ">", "is", "is not", "in", "not in",
      ), $.expression,
    )),

    dotted_name: ($) => seq(choice($.identifier, $.type_identifier, "self"), repeat1(seq(".", $.identifier))),

    argument_list: ($) => seq(
      "(",
      optional(seq(commaSep(choice($.keyword_argument, $.expression)), optional(","))),
      ")",
    ),

    keyword_argument: ($) => seq($.identifier, "=", $.expression),

    // ---- lexical ----------------------------------------------------

    comment: ($) => token(prec(-1, /#[^\r\n]*/)),

    identifier: ($) => /(?:_|_*[a-zA-Z][a-zA-Z0-9_]*)/,

    number: ($) => choice($.integer, $.float),

    integer: ($) => /0x[0-9a-fA-F_]+|[0-9][0-9_]*/,

    float: ($) => /[0-9][0-9_]*\.[0-9_]*([eE][+-]?[0-9]+)?|[0-9][0-9_]*[eE][+-]?[0-9]+/,

    string: ($) => choice(
      token(/f"(\\.|[^"\\\r\n])*"/),
      token(/"(\\.|[^"\\\r\n])*"/),
      token(/'(\\.|[^'\\\r\n])*'/),
    ),
  },
});
