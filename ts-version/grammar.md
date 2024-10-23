# Parser Grammar

This is the grammar for the stunt programming language.

```
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
               | "(" expression ")" ;
```