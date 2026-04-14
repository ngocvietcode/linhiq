module.exports = {
  apps: [
    {
      name: "linhiq-api",
      script: "npx",
      args: "tsx dist/main.js",
      cwd: "./apps/api",
      env: {
        NODE_ENV: "production",
      },
      env_file: "../../.env.prod",
    },
    {
      name: "linhiq-web",
      script: "npm",
      args: "run start",
      cwd: "./apps/web",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_file: "../../.env.prod",
    },
  ],
};
