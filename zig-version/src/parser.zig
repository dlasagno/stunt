const std = @import("std");
const Token = @import("scanner.zig").Token;

const ASTNode = union(enum) {
    binary: struct {
        left: *ASTNode,
        right: *ASTNode,
        op: Token,
    },
};
