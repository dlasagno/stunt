# Parser Grammar

This is the grammar for the stunt programming language.

```
program       -> declaration* EOF ;
declaration   -> constDecl
               | letDecl
               | statement ;
statement     -> exprStmt
               | assignment ;

constDecl     -> "const" IDENTIFIER "=" expression ";" ;
letDecl       -> "let" IDENTIFIER "=" expression ";" ;

exprStmt      -> expression ";" ;
assignment    -> IDENTIFIER "=" expression ";" ;

expression    -> equality ;
equality      -> comparison ( ( "!=" | "==" ) comparison )* ;
comparison    -> term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
term          -> factor ( ( "-" | "+" ) factor )* ;
factor        -> unary ( ( "/" | "*" ) unary )* ;
unary         -> ( "-" | "+" ) unary
               | primary ;
primary       -> NUMBER
               | STRING
               | "true"
               | "false"
               | "(" expression ")"
               | IDENTIFIER ;
```
