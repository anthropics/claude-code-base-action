import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

interface OAuthCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export async function setupOAuthCredentials(credentials: OAuthCredentials) {
  const claudeDir = join(homedir(), ".claude");
  const credentialsPath = join(claudeDir, ".credentials.json");

  // Create the .claude directory if it doesn't exist
  await mkdir(claudeDir, { recursive: true });

  // Create the credentials JSON structure
  const credentialsData = {
    claudeAiOauth: {
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      expiresAt: parseInt(credentials.expiresAt),
      scopes: ["user:inference", "user:profile"],
    },
  };

  // Write the credentials file
  await writeFile(credentialsPath, JSON.stringify(credentialsData, null, 2));

  console.log(`OAuth credentials written to ${credentialsPath}`);
}
