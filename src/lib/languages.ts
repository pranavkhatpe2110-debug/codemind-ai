export type Language = {
  /** Also the language id that Monaco understands. */
  id: string;
  label: string;
  /** File extension, used later for project files. */
  extension: string;
};

export const LANGUAGES: Language[] = [
  { id: "javascript", label: "JavaScript", extension: "js" },
  { id: "typescript", label: "TypeScript", extension: "ts" },
  { id: "python", label: "Python", extension: "py" },
  { id: "java", label: "Java", extension: "java" },
  { id: "c", label: "C", extension: "c" },
  { id: "cpp", label: "C++", extension: "cpp" },
  { id: "csharp", label: "C#", extension: "cs" },
  { id: "go", label: "Go", extension: "go" },
  { id: "rust", label: "Rust", extension: "rs" },
  { id: "php", label: "PHP", extension: "php" },
  { id: "ruby", label: "Ruby", extension: "rb" },
  { id: "swift", label: "Swift", extension: "swift" },
  { id: "kotlin", label: "Kotlin", extension: "kt" },
  { id: "sql", label: "SQL", extension: "sql" },
  { id: "html", label: "HTML", extension: "html" },
  { id: "css", label: "CSS", extension: "css" },
  { id: "json", label: "JSON", extension: "json" },
  { id: "shell", label: "Shell / Bash", extension: "sh" },
  { id: "markdown", label: "Markdown", extension: "md" },
  { id: "plaintext", label: "Plain text", extension: "txt" },
];

export const DEFAULT_LANGUAGE = "javascript";

export function isLanguageId(value: unknown): value is string {
  return typeof value === "string" && LANGUAGES.some((l) => l.id === value);
}

const SAMPLES: Record<string, string> = {
  javascript: `// Add up the numbers in an array
function sum(numbers) {
  let total = 0;
  for (const n of numbers) {
    total += n;
  }
  return total;
}

console.log(sum([1, 2, 3]));
`,
  typescript: `// Add up the numbers in an array
function sum(numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}

console.log(sum([1, 2, 3]));
`,
  python: `# Add up the numbers in a list
def total(numbers):
    result = 0
    for n in numbers:
        result += n
    return result


print(total([1, 2, 3]))
`,
  java: `public class Main {
    static int sum(int[] numbers) {
        int total = 0;
        for (int n : numbers) {
            total += n;
        }
        return total;
    }

    public static void main(String[] args) {
        System.out.println(sum(new int[] {1, 2, 3}));
    }
}
`,
  c: `#include <stdio.h>

int main(void) {
    int numbers[] = {1, 2, 3};
    int total = 0;
    for (int i = 0; i < 3; i++) {
        total += numbers[i];
    }
    printf("%d\\n", total);
    return 0;
}
`,
  cpp: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> numbers = {1, 2, 3};
    int total = 0;
    for (int n : numbers) {
        total += n;
    }
    std::cout << total << std::endl;
    return 0;
}
`,
  csharp: `using System;
using System.Linq;

class Program
{
    static void Main()
    {
        int[] numbers = { 1, 2, 3 };
        Console.WriteLine(numbers.Sum());
    }
}
`,
  go: `package main

import "fmt"

func sum(numbers []int) int {
	total := 0
	for _, n := range numbers {
		total += n
	}
	return total
}

func main() {
	fmt.Println(sum([]int{1, 2, 3}))
}
`,
  rust: `fn sum(numbers: &[i32]) -> i32 {
    numbers.iter().sum()
}

fn main() {
    println!("{}", sum(&[1, 2, 3]));
}
`,
  php: `<?php

function total(array $numbers): int {
    return array_sum($numbers);
}

echo total([1, 2, 3]);
`,
  ruby: `def total(numbers)
  numbers.sum
end

puts total([1, 2, 3])
`,
  swift: `func sum(_ numbers: [Int]) -> Int {
    return numbers.reduce(0, +)
}

print(sum([1, 2, 3]))
`,
  kotlin: `fun sum(numbers: List<Int>): Int = numbers.sum()

fun main() {
    println(sum(listOf(1, 2, 3)))
}
`,
  sql: `-- Find the 5 newest projects
SELECT id, name, created_at
FROM projects
ORDER BY created_at DESC
LIMIT 5;
`,
  html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Hello</title>
  </head>
  <body>
    <h1>Hello, CodeMind AI!</h1>
  </body>
</html>
`,
  css: `.card {
  padding: 1rem;
  border: 1px solid #333;
  border-radius: 0.75rem;
}
`,
  json: `{
  "name": "codemind-ai",
  "version": "1.0.0"
}
`,
  shell: `#!/usr/bin/env bash
for file in *.txt; do
  echo "Found: $file"
done
`,
  markdown: `# My notes

- First item
- Second item
`,
  plaintext: "",
};

export function getSample(languageId: string): string {
  return SAMPLES[languageId] ?? "";
}
