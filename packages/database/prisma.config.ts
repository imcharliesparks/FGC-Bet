import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // The main entry for your schema
  schema: 'prisma/schema.prisma',

  // Where migrations should be generated
  migrations: {
    path: 'prisma/migrations',
  },

  // The database URL
  datasource: {
    url: env('DATABASE_URL'),
    // Uncomment if you use a pooler or want a separate direct connection for migrations.
    // directUrl: env('DIRECT_DATABASE_URL'),
  },
});
