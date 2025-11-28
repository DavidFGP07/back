const { defineConfig } = require("prisma/config");

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Para SQLite no necesitas .env, es solo un archivo local
    url: "file:./dev.db",
  },
});