const std = @import("std");
const CompilerError = @import("error-reporter.zig").CompilerError;

const writer = std.io.getStdOut().writer();

pub const Token = struct {
    token_type: TokenType,
    lexeme: []const u8,
    literal: Literal,
    position: usize,

    pub fn print(self: Token) !void {
        try writer.print("{s} {s} {}\n", .{ @tagName(self.token_type), self.lexeme, self.literal });
    }
};

pub const TokenType = union(enum) {
    // Single-character tokens
    LEFT_PAREN,
    RIGHT_PAREN,
    LEFT_BRACE,
    RIGHT_BRACE,
    COMMA,
    DOT,
    MINUS,
    PLUS,
    SEMICOLON,
    SLASH,
    STAR,

    // One or two character tokens
    BANG,
    BANG_EQUAL,
    EQUAL,
    EQUAL_EQUAL,
    GREATER,
    GREATER_EQUAL,
    LESS,
    LESS_EQUAL,

    // Literals
    IDENTIFIER,
    STRING,
    NUMBER,

    // Keywords
    AND,
    CONST,
    ELSE,
    FALSE,
    FN,
    FOR,
    IF,
    LET,
    OR,
    RETURN,
    TRUE,
    WHILE,

    EOF,
};

pub const Literal = union(enum) {
    none,
    number: f64,
    string: []const u8,

    pub fn format(self: Literal, comptime _: []const u8, _: std.fmt.FormatOptions, _writer: anytype) !void {
        switch (self) {
            .none => {
                _ = try _writer.write("null");
            },
            .string => |s| {
                try _writer.print("{s}", .{s});
            },
            .number => |n| {
                try _writer.print("{d}", .{n});
            },
        }
    }
};

pub const Scanner = struct {
    source: []const u8,
    tokens: std.ArrayList(Token),
    errors: std.ArrayList(CompilerError),
    start: usize,
    current: usize,
    line: usize,

    pub fn init(source: []const u8) Scanner {
        return Scanner{
            .source = source,
            .tokens = std.ArrayList(Token).init(std.heap.page_allocator),
            .errors = std.ArrayList(CompilerError).init(std.heap.page_allocator),
            .start = 0,
            .current = 0,
            .line = 1,
        };
    }

    pub fn deinit(self: *Scanner) void {
        self.tokens.deinit();
        self.errors.deinit();
    }

    fn isAtEnd(self: Scanner) bool {
        return self.current >= self.source.len;
    }

    pub fn scanTokens(self: *Scanner) !void {
        while (!self.isAtEnd()) {
            self.start = self.current;
            try self.scanToken();
        }

        try self.addToken(.EOF, null);
    }

    fn scanToken(self: *Scanner) !void {
        const c = self.advance();
        switch (c) {
            '(' => try self.addToken(.LEFT_PAREN, null),
            ')' => try self.addToken(.RIGHT_PAREN, null),
            '{' => try self.addToken(.LEFT_BRACE, null),
            '}' => try self.addToken(.RIGHT_BRACE, null),
            ',' => try self.addToken(.COMMA, null),
            '.' => try self.addToken(.DOT, null),
            '-' => try self.addToken(.MINUS, null),
            '+' => try self.addToken(.PLUS, null),
            ';' => try self.addToken(.SEMICOLON, null),
            '/' => try self.addToken(.SLASH, null),
            '*' => try self.addToken(.STAR, null),
            ' ', '\t', '\r' => {},
            '\n' => self.line += 1,
            else => {
                if (std.ascii.isDigit(c)) {
                    try self.scanNumber();
                }
                try self.addError("Unexpected character");
            },
        }
    }

    fn scanNumber(self: *Scanner) !void {
        while (std.ascii.isDigit(self.peek()) or self.peek() == '_' and std.ascii.isDigit(self.peekNext())) {
            _ = self.advance();
        }

        if (self.peek() == '.' and std.ascii.isDigit(self.peekNext())) {
            _ = self.advance();
            while (std.ascii.isDigit(self.peek()) or self.peek() == '_' and std.ascii.isDigit(self.peekNext())) {
                _ = self.advance();
            }
        }

        try self.addToken(.NUMBER, Literal{ .number = std.fmt.parseFloat(f64, self.source[self.start..self.current]) catch unreachable });
    }

    fn addToken(self: *Scanner, token_type: TokenType, literal: ?Literal) !void {
        try self.tokens.append(Token{
            .token_type = token_type,
            .lexeme = self.source[self.start..self.current],
            .literal = literal orelse .none,
            .position = self.start,
        });
    }

    fn addError(self: *Scanner, message: []const u8) !void {
        try self.errors.append(CompilerError{
            .position = self.start,
            .length = self.current - self.start,
            .message = message,
        });
    }

    fn advance(self: *Scanner) u8 {
        const c = self.source[self.current];
        self.current += 1;
        return c;
    }

    fn peek(self: Scanner) u8 {
        if (self.isAtEnd()) {
            return 0;
        }
        return self.source[self.current];
    }

    fn peekNext(self: Scanner) u8 {
        if (self.current + 1 >= self.source.len) {
            return 0;
        }
        return self.source[self.current + 1];
    }
};
