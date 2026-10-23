#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
const compiledSchemaPath = path.resolve(
  __dirname,
  "../node_modules/.prisma/client/schema.prisma"
);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.trim();
  }
  // Try loading from .env.production, .env.local, .env
  const localEnv = loadEnvFile(path.resolve(__dirname, "../.env.local"));
  if (localEnv.DATABASE_URL) return localEnv.DATABASE_URL.trim();

  const rootEnv = loadEnvFile(path.resolve(__dirname, "../.env"));
  if (rootEnv.DATABASE_URL) return rootEnv.DATABASE_URL.trim();

  return "";
}

function getTargetProvider() {
  // Check CLI arguments first: --provider=postgresql or --provider=sqlite
  const arg = process.argv.find((a) => a.startsWith("--provider="));
  if (arg) {
    const val = arg.split("=")[1]?.trim().toLowerCase();
    if (val === "postgresql" || val === "postgres") return "postgresql";
    if (val === "sqlite") return "sqlite";
  }

  const databaseUrl = getDatabaseUrl();
  const isPostgresUrl =
    databaseUrl.startsWith("postgres://") ||
    databaseUrl.startsWith("postgresql://");
  const isSqliteUrl = databaseUrl.startsWith("file:");

  // On Vercel or in production, default to postgresql unless explicitly overridden
  const isVercel = Boolean(
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.NEXT_PUBLIC_VERCEL_ENV
  );

  if (isPostgresUrl) {
    return "postgresql";
  }

  if (isVercel && !isSqliteUrl) {
    return "postgresql";
  }

  if (isSqliteUrl) {
    return "sqlite";
  }

  // Default to sqlite for local development if not specified
  return "sqlite";
}

function getCompiledProvider() {
  if (!fs.existsSync(compiledSchemaPath)) return null;
  const content = fs.readFileSync(compiledSchemaPath, "utf8");
  const match = content.match(
    /datasource\s+db\s*\{[\s\S]*?provider\s*=\s*"([^"]+)"/
  );
  return match ? match[1] : null;
}

function updateSchemaProvider() {
  if (!fs.existsSync(schemaPath)) {
    console.error(`[prepare-prisma] Schema file not found at: ${schemaPath}`);
    process.exit(1);
  }

  const targetProvider = getTargetProvider();
  const currentContent = fs.readFileSync(schemaPath, "utf8");

  // Replace provider inside datasource db block
  const updatedContent = currentContent.replace(
    /(datasource\s+db\s*\{[\s\S]*?provider\s*=\s*")[^"]+(")/,
    `$1${targetProvider}$2`
  );

  let schemaChanged = false;
  if (currentContent !== updatedContent) {
    fs.writeFileSync(schemaPath, updatedContent, "utf8");
    schemaChanged = true;
    console.log(
      `[prepare-prisma] Updated prisma/schema.prisma datasource provider to: "${targetProvider}"`
    );
  } else {
    console.log(
      `[prepare-prisma] prisma/schema.prisma datasource provider already set to: "${targetProvider}"`
    );
  }

  const compiledProvider = getCompiledProvider();
  const forceGenerate = process.argv.includes("--generate");

  // If the compiled Prisma Client does not match the target provider, regenerate it
  if (schemaChanged || forceGenerate || (compiledProvider && compiledProvider !== targetProvider)) {
    console.log(
      `[prepare-prisma] Regenerating Prisma Client for provider: "${targetProvider}"...`
    );
    try {
      execSync("npx prisma generate", {
        stdio: "inherit",
        env: {
          ...process.env,
          // Ensure appropriate dummy DATABASE_URL if none set so generate never fails
          DATABASE_URL:
            process.env.DATABASE_URL ||
            (targetProvider === "postgresql"
              ? "postgresql://postgres:postgres@localhost:5432/postgres"
              : "file:./dev.db"),
        },
      });
      console.log(`[prepare-prisma] Prisma Client successfully generated.`);
    } catch (err) {
      console.error(
        `[prepare-prisma] Failed to generate Prisma Client:`,
        err.message
      );
      process.exit(1);
    }
  }
}

updateSchemaProvider();
