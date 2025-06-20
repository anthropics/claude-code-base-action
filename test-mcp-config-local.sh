#!/bin/bash

# Local test script to compare .mcp.json vs --mcp-config behavior
# Run this from the root of claude-code-base-action repository

set -e

echo "=== Testing MCP server loading: .mcp.json vs --mcp-config ==="

# Check if ANTHROPIC_API_KEY is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "Error: ANTHROPIC_API_KEY environment variable is not set"
    echo "Please export your API key: export ANTHROPIC_API_KEY='your-key-here'"
    exit 1
fi

# Ensure dependencies are installed
echo "Installing dependencies..."
bun install
cd test/mcp-test
bun install
cd ../..

# Test 1: Using .mcp.json (current method)
echo ""
echo "=== Test 1: Using .mcp.json file ==="
cd test/mcp-test
echo "Working directory: $(pwd)"
echo "Contents of .mcp.json:"
cat .mcp.json

echo ""
echo "Running Claude with .mcp.json..."
claude -p "List all available tools" --output-format json > /tmp/claude-mcp-json-output.json 2>&1 || echo "Claude execution completed with exit code: $?"

echo "Checking output for MCP tools..."
if jq -e '.[] | select(.type == "system" and .subtype == "init") | .tools[] | select(. == "mcp__test-server__test_tool")' /tmp/claude-mcp-json-output.json > /dev/null; then
    echo "✓ .mcp.json test: MCP test tool found"
    MCP_JSON_SUCCESS=true
else
    echo "✗ .mcp.json test: MCP test tool NOT found"
    echo "Init tools found:"
    jq '.[] | select(.type == "system" and .subtype == "init") | .tools' /tmp/claude-mcp-json-output.json || echo "No init tools found"
    MCP_JSON_SUCCESS=false
fi

cd ../..

# Test 2: Using --mcp-config flag
echo ""
echo "=== Test 2: Using --mcp-config flag ==="
cd test/mcp-test
echo "Working directory: $(pwd)"

MCP_CONFIG='{"mcpServers":{"test-server":{"type":"stdio","command":"bun","args":["simple-mcp-server.ts"],"env":{}}}}'
echo "MCP config string: $MCP_CONFIG"

echo ""
echo "Running Claude with --mcp-config..."
claude -p "List all available tools" --output-format json --mcp-config "$MCP_CONFIG" > /tmp/claude-mcp-config-output.json 2>&1 || echo "Claude execution completed with exit code: $?"

echo "Checking output for MCP tools..."
if jq -e '.[] | select(.type == "system" and .subtype == "init") | .tools[] | select(. == "mcp__test-server__test_tool")' /tmp/claude-mcp-config-output.json > /dev/null; then
    echo "✓ --mcp-config test: MCP test tool found"
    MCP_CONFIG_SUCCESS=true
else
    echo "✗ --mcp-config test: MCP test tool NOT found"
    echo "Init tools found:"
    jq '.[] | select(.type == "system" and .subtype == "init") | .tools' /tmp/claude-mcp-config-output.json || echo "No init tools found"
    MCP_CONFIG_SUCCESS=false
fi

cd ../..

# Summary
echo ""
echo "=== SUMMARY ==="
echo "Test results:"
if [ "$MCP_JSON_SUCCESS" = true ]; then
    echo "  ✓ .mcp.json method: SUCCESS"
else
    echo "  ✗ .mcp.json method: FAILED"
fi

if [ "$MCP_CONFIG_SUCCESS" = true ]; then
    echo "  ✓ --mcp-config method: SUCCESS"
else
    echo "  ✗ --mcp-config method: FAILED"
fi

echo ""
echo "Raw output files saved to:"
echo "  .mcp.json test: /tmp/claude-mcp-json-output.json"
echo "  --mcp-config test: /tmp/claude-mcp-config-output.json"

# Exit with appropriate code
if [ "$MCP_JSON_SUCCESS" = "$MCP_CONFIG_SUCCESS" ]; then
    if [ "$MCP_JSON_SUCCESS" = true ]; then
        echo "✓ Both methods work identically (SUCCESS)"
        exit 0
    else
        echo "⚠ Both methods fail identically - indicates broader issue"
        exit 1
    fi
else
    echo "⚠ Methods have different results - indicates method-specific issue!"
    if [ "$MCP_CONFIG_SUCCESS" = true ]; then
        echo "  --mcp-config works but .mcp.json fails → .mcp.json approval/processing issue"
    else
        echo "  .mcp.json works but --mcp-config fails → --mcp-config parsing issue"
    fi
    exit 1
fi