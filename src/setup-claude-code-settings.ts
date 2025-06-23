import { $ } from "bun";
import { homedir } from "os";
import { join } from "path";

/**
 * Get Claude's config directory using XDG path when available
 * Priority order:
 * 1. XDG_CONFIG_HOME/claude (XDG Base Directory spec)
 * 2. ~/.claude (legacy fallback)
 */
function getClaudeConfigHomeDir(): string {
  if (process.env.XDG_CONFIG_HOME) {
    return join(process.env.XDG_CONFIG_HOME, "claude");
  }

  return join(homedir(), ".claude");
}

export async function setupClaudeCodeSettings() {
  const configDir = getClaudeConfigHomeDir();
  const settingsPath = join(configDir, "settings.json");
  console.log(`Setting up Claude settings at: ${settingsPath}`);

  // Ensure config directory exists
  console.log(`Creating config directory...`);
  await $`mkdir -p ${configDir}`.quiet();

  let settings: Record<string, unknown> = {};
  try {
    const existingSettings = await $`cat ${settingsPath}`.quiet().text();
    if (existingSettings.trim()) {
      settings = JSON.parse(existingSettings);
      console.log(
        `Found existing settings:`,
        JSON.stringify(settings, null, 2),
      );
    } else {
      console.log(`Settings file exists but is empty`);
    }
  } catch (e) {
    console.log(`No existing settings file found, creating new one`);
  }

  settings.enableAllProjectMcpServers = true;
  console.log(`Updated settings with enableAllProjectMcpServers: true`);

  await $`echo ${JSON.stringify(settings, null, 2)} > ${settingsPath}`.quiet();
  console.log(`Settings saved successfully`);
}
