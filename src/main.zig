const std = @import("std");
const Scanner = @import("scanner.zig").Scanner;

pub fn main() !void {
    // stdout is for the actual output of your application, for example if you
    // are implementing gzip, then only the compressed bytes should be sent to
    // stdout, not any debugging messages.
    const stdout_file = std.io.getStdOut().writer();
    var bw = std.io.bufferedWriter(stdout_file);
    const stdout = bw.writer();

    const args = try std.process.argsAlloc(std.heap.page_allocator);
    defer std.process.argsFree(std.heap.page_allocator, args);
    if (args.len < 3) {
        try stdout.print("Usage: stunt <input> <output>\n", .{});
        std.process.exit(1);
    }

    const input_file = args[1];
    // const output_file = args[2];

    const input = try std.fs.cwd().readFileAlloc(std.heap.page_allocator, input_file, std.math.maxInt(usize));
    defer std.heap.page_allocator.free(input);

    var scanner = Scanner.init(input);
    defer scanner.deinit();

    try scanner.scanTokens();
    for (scanner.tokens.items) |token| {
        try token.print();
    }

    try bw.flush(); // Don't forget to flush!
}

test "simple test" {
    var list = std.ArrayList(i32).init(std.testing.allocator);
    defer list.deinit(); // Try commenting this out and see if zig detects the memory leak!
    try list.append(42);
    try std.testing.expectEqual(@as(i32, 42), list.pop());
}

test "fuzz example" {
    // Try passing `--fuzz` to `zig build` and see if it manages to fail this test case!
    const input_bytes = std.testing.fuzzInput(.{});
    try std.testing.expect(!std.mem.eql(u8, "canyoufindme", input_bytes));
}
