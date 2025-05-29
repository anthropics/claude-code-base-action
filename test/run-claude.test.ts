#!/usr/bin/env bun

import { describe, test, expect } from "bun:test";
import { prepareRunConfig, type ClaudeOptions } from "../src/run-claude";

describe("prepareRunConfig", () => {
  test("should prepare config with basic arguments", () => {
    const options: ClaudeOptions = {};
    const prepared = prepareRunConfig("/tmp/test-prompt.txt", options);

    expect(prepared.claudeArgs.slice(0, 4)).toEqual([
      "-p",
      "--verbose",
      "--output-format",
      "stream-json",
    ]);
  });

  test("should include promptPath", () => {
    const options: ClaudeOptions = {};
    const prepared = prepareRunConfig("/tmp/test-prompt.txt", options);

    expect(prepared.promptPath).toBe("/tmp/test-prompt.txt");
  });

  test("should include allowed tools in command arguments", () => {
    const options: ClaudeOptions = {
      allowedTools: "Bash,Read",
    };
    const prepared = prepareRunConfig("/tmp/test-prompt.txt", options);

    expect(prepared.claudeArgs).toContain("--allowedTools");
    expect(prepared.claudeArgs).toContain("Bash,Read");
  });

  test("should include disallowed tools in command arguments", () => {
    const options: ClaudeOptions = {
      disallowedTools: "Bash,Read",
    };
    const prepared = prepareRunConfig("/tmp/test-prompt.txt", options);

    expect(prepared.claudeArgs).toContain("--disallowedTools");
    expect(prepared.claudeArgs).toContain("Bash,Read");
  });

  test("should include max turns in command arguments", () => {
    const options: ClaudeOptions = {
      maxTurns: "5",
    };
    const prepared = prepareRunConfig("/tmp/test-prompt.txt", options);

    expect(prepared.claudeArgs).toContain("--max-turns");
    expect(prepared.claudeArgs).toContain("5");
  });

  test("should include mcp config in command arguments", () => {
    const options: ClaudeOptions = {
      mcpConfig: "/path/to/mcp-config.json",
    };
    const prepared = prepareRunConfig("/tmp/test-prompt.txt", options);

    expect(prepared.claudeArgs).toContain("--mcp-config");
    expect(prepared.claudeArgs).toContain("/path/to/mcp-config.json");
  });

  test("should use provided prompt path", () => {
    const options: ClaudeOptions = {};
    const prepared = prepareRunConfig("/custom/prompt/path.txt", options);

    expect(prepared.promptPath).toBe("/custom/prompt/path.txt");
  });

  test("should not include optional arguments when not set", () => {
    const options: ClaudeOptions = {};
    const prepared = prepareRunConfig("/tmp/test-prompt.txt", options);

    expect(prepared.claudeArgs).not.toContain("--allowedTools");
    expect(prepared.claudeArgs).not.toContain("--disallowedTools");
    expect(prepared.claudeArgs).not.toContain("--max-turns");
    expect(prepared.claudeArgs).not.toContain("--mcp-config");
  });

  test("should preserve order of claude arguments", () => {
    const options: ClaudeOptions = {
      allowedTools: "Bash,Read",
      maxTurns: "3",
    };
    const prepared = prepareRunConfig("/tmp/test-prompt.txt", options);

    expect(prepared.claudeArgs).toEqual([
      "-p",
      "--verbose",
      "--output-format",
      "stream-json",
      "--allowedTools",
      "Bash,Read",
      "--max-turns",
      "3",
    ]);
  });

  describe("maxTurns validation", () => {
    test("should accept valid maxTurns value", () => {
      const options: ClaudeOptions = { maxTurns: "5" };
      const prepared = prepareRunConfig("/tmp/test-prompt.txt", options);
      expect(prepared.claudeArgs).toContain("--max-turns");
      expect(prepared.claudeArgs).toContain("5");
    });

    test("should throw error for non-numeric maxTurns", () => {
      const options: ClaudeOptions = { maxTurns: "abc" };
      expect(() => prepareRunConfig("/tmp/test-prompt.txt", options)).toThrow(
        "maxTurns must be a positive number, got: abc",
      );
    });

    test("should throw error for negative maxTurns", () => {
      const options: ClaudeOptions = { maxTurns: "-1" };
      expect(() => prepareRunConfig("/tmp/test-prompt.txt", options)).toThrow(
        "maxTurns must be a positive number, got: -1",
      );
    });

    test("should throw error for zero maxTurns", () => {
      const options: ClaudeOptions = { maxTurns: "0" };
      expect(() => prepareRunConfig("/tmp/test-prompt.txt", options)).toThrow(
        "maxTurns must be a positive number, got: 0",
      );
    });
  });
});
