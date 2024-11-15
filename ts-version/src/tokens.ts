export type Token<T extends TokenType = TokenType> = {
  type: T;
  lexeme: string;
  literal: undefined | number | string;
  position: number;
};

export type TokenType =
  // Single-character tokens
  | "LEFT_PAREN"
  | "RIGHT_PAREN"
  | "LEFT_BRACE"
  | "RIGHT_BRACE"
  | "COMMA"
  | "DOT"
  | "MINUS"
  | "PLUS"
  | "SEMICOLON"
  | "SLASH"
  | "STAR"
  // One or two character tokens
  | "BANG"
  | "BANG_EQUAL"
  | "EQUAL"
  | "EQUAL_EQUAL"
  | "GREATER"
  | "GREATER_EQUAL"
  | "LESS"
  | "LESS_EQUAL"
  // Literals
  | "IDENTIFIER"
  | "STRING"
  | "NUMBER"
  // Keywords
  | "AND"
  | "CONST"
  | "ELSE"
  | "FALSE"
  | "FN"
  | "FOR"
  | "IF"
  | "LET"
  | "OR"
  | "RETURN"
  | "TRUE"
  | "WHILE"
  | "EOF";
