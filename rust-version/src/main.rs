use std::env;
use std::fs;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 3 {
        println!("Usage: stunt <input> <output>");
        std::process::exit(1);
    }

    let input_file = &args[1];
    let output_file = &args[2];

    let input_file = fs::read_to_string(input_file);
    if input_file.is_err() {
        println!("Failed to read input file");
        std::process::exit(1);
    }
    let input = input_file.unwrap();

    println!("Hello, world!");
}
