import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const textExtensions = new Set([
  ".css",
  ".env",
  ".example",
  ".gitignore",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yml",
  ".yaml",
]);

const secretFilePatterns = [
  /(^|[\\/])\.env($|\.)/i,
  /\.(pem|key|p12|pfx|crt|cer|jks|keystore)$/i,
  /(^|[\\/])(\.secrets|secrets|credentials)([\\/]|$)/i,
  /(^|[\\/]).*(service-account|credentials?|secret).*\.(json|txt|env)$/i,
];

const allowedSecretFilePatterns = [/\.env\.example$/i];

const contentRules = [
  {
    name: "GitHub token",
    regex:
      /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  },
  {
    name: "OpenAI API key",
    regex: /\bsk-[A-Za-z0-9]{20,}\b/g,
  },
  {
    name: "AWS access key",
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    name: "private key block",
    regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
  },
];

const sensitiveEnvName =
  /(SECRET|TOKEN|PASSWORD|PRIVATE_KEY|SERVICE_ROLE|DATABASE_URL|API_KEY|ANON_KEY|CLIENT_SECRET)/i;

const placeholderValue =
  /^(|["']?["']?)$|example|placeholder|changeme|change-me|replace|redacted|dummy|todo|xxx|<.+>|\.\.\.|sua_|_aqui/i;

const git = (args) => {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    const message =
      result.error?.message ||
      result.stderr?.trim() ||
      `git ${args.join(" ")} failed`;
    throw new Error(message);
  }

  return result.stdout;
};

const normalizePath = (file) => file.replaceAll("\\", "/");

const isAllowedSecretFile = (file) =>
  allowedSecretFilePatterns.some((pattern) => pattern.test(normalizePath(file)));

const isSecretFile = (file) => {
  const normalized = normalizePath(file);
  return secretFilePatterns.some((pattern) => pattern.test(normalized));
};

const lineNumberForIndex = (content, index) =>
  content.slice(0, index).split(/\r?\n/).length;

const shouldScanContent = (file, content) => {
  if (content.includes("\0")) {
    return false;
  }

  const normalized = normalizePath(file);
  const dotIndex = normalized.lastIndexOf(".");
  const extension = dotIndex >= 0 ? normalized.slice(dotIndex).toLowerCase() : "";

  return textExtensions.has(extension) || normalized.includes(".env");
};

const listFiles = (args) =>
  git(args)
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);

const trackedFiles = listFiles(["ls-files", "--cached"]);
const unignoredFiles = listFiles(["ls-files", "--others", "--exclude-standard"]);
const files = [...new Set([...trackedFiles, ...unignoredFiles])];
const trackedFileSet = new Set(trackedFiles.map(normalizePath));
const findings = [];

for (const file of trackedFiles) {
  if (isSecretFile(file) && !isAllowedSecretFile(file)) {
    findings.push({
      file,
      line: 1,
      rule: "sensitive file is tracked by Git",
    });
  }
}

for (const file of files) {
  let content;

  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  if (!shouldScanContent(file, content)) {
    continue;
  }

  for (const rule of contentRules) {
    for (const match of content.matchAll(rule.regex)) {
      findings.push({
        file,
        line: lineNumberForIndex(content, match.index ?? 0),
        rule: rule.name,
      });
    }
  }

  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const assignment = line.match(
      /^\s*(?:export\s+)?([A-Z0-9_]*?(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|SERVICE_ROLE|DATABASE_URL|API_KEY|ANON_KEY|CLIENT_SECRET)[A-Z0-9_]*)\s*=\s*["']?(.+?)["']?\s*$/i,
    );

    if (!assignment) {
      return;
    }

    const [, name, rawValue] = assignment;
    const value = rawValue.trim();

    if (!sensitiveEnvName.test(name) || placeholderValue.test(value)) {
      return;
    }

    findings.push({
      file,
      line: index + 1,
      rule: `non-placeholder value for ${name}`,
    });
  });
}

const remotes = git(["remote", "-v"]);
const remoteCredentialPatterns = [
  /https:\/\/[^/\s:@]+:[^@\s]+@/i,
  /https:\/\/(?:ghp|gho|ghu|ghs|ghr|github_pat)_[^@\s]+@/i,
];

if (remoteCredentialPatterns.some((pattern) => pattern.test(remotes))) {
  findings.push({
    file: ".git/config",
    line: 1,
    rule: "credential embedded in Git remote URL",
  });
}

if (findings.length > 0) {
  console.error("Potential secret exposure detected:");
  for (const finding of findings) {
    const trackedLabel = trackedFileSet.has(normalizePath(finding.file))
      ? "tracked"
      : "untracked";
    console.error(
      `- ${finding.file}:${finding.line} [${trackedLabel}] ${finding.rule}`,
    );
  }
  process.exit(1);
}

console.log("No tracked secrets or credentialed remotes detected.");
