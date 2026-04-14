const path = require("path");
const fs = require("fs");

// Read .env.prod and parse key=value pairs
function loadEnv(filePath) {
  const env = {};
  if (fs.existsSync(filePath)) {
    fs.readFileSync(filePath, "utf-8")
      .split("\n")
      .forEach((line) => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
      });
  }
  return env;
}

const rootDir = __dirname;
const envFile = path.join(rootDir, ".env.prod");
const env = loadEnv(envFile);

const DATABASE_URL = `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@127.0.0.1:5432/${env.POSTGRES_DB}?schema=public`;
const REDIS_URL = `redis://:${env.REDIS_PASSWORD}@127.0.0.1:6379`;

module.exports = {
  apps: [
    {
      name: "linhiq-api",
      script: "tsx",
      args: "dist/main.js",
      cwd: path.join(rootDir, "apps/api"),
      env: {
        ...env,
        NODE_ENV: "production",
        DATABASE_URL,
        REDIS_URL,
      },
    },
    {
      name: "linhiq-web",
      script: "npm",
      args: "run start",
      cwd: path.join(rootDir, "apps/web"),
      env: {
        ...env,
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
