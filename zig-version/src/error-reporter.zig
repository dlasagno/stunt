const std = @import("std");

pub const CompilerError = struct {
    position: usize,
    length: usize,
    message: []const u8,
};

pub fn printError(line: usize, comptime fmt: []const u8, args: anytype) void {
    std.debug.print("[line {}] Error: ", .{line});
    std.debug.print(fmt, args);
    std.debug.print("\n", .{});
}
