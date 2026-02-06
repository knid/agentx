import {
  pgTable,
  uuid,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  githubId: integer('github_id').unique().notNull(),
  username: varchar('username', { length: 100 }).unique().notNull(),
  displayName: varchar('display_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  website: text('website'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

export const agents = pgTable(
  'agents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scope: varchar('scope', { length: 100 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    description: text('description'),
    readme: text('readme'),
    category: varchar('category', { length: 50 }),
    tags: text('tags')
      .array()
      .default(sql`'{}'`),
    license: varchar('license', { length: 50 }),
    repository: text('repository'),
    homepage: text('homepage'),
    downloadCount: integer('download_count').default(0).notNull(),
    starCount: integer('star_count').default(0).notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    isDeprecated: boolean('is_deprecated').default(false).notNull(),
    latestVersion: varchar('latest_version', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('agents_scope_name_idx').on(table.scope, table.name),
    index('agents_category_idx').on(table.category),
    index('agents_author_id_idx').on(table.authorId),
    index('agents_download_count_idx').on(table.downloadCount.desc()),
    index('agents_search_idx').using(
      'gin',
      sql`to_tsvector('english', ${table.name} || ' ' || coalesce(${table.description}, ''))`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Agent Versions
// ---------------------------------------------------------------------------

export const agentVersions = pgTable(
  'agent_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    version: varchar('version', { length: 50 }).notNull(),
    tarballUrl: text('tarball_url').notNull(),
    tarballSha256: varchar('tarball_sha256', { length: 64 }).notNull(),
    tarballSize: integer('tarball_size').notNull(),
    agentYaml: jsonb('agent_yaml').notNull(),
    requires: jsonb('requires'),
    mcpServers: jsonb('mcp_servers'),
    permissions: jsonb('permissions'),
    downloadCount: integer('download_count').default(0).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('agent_versions_agent_id_version_idx').on(table.agentId, table.version),
  ],
);

// ---------------------------------------------------------------------------
// Stars
// ---------------------------------------------------------------------------

export const stars = pgTable(
  'stars',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.agentId] }),
  ],
);

// ---------------------------------------------------------------------------
// Downloads
// ---------------------------------------------------------------------------

export const downloads = pgTable(
  'downloads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    version: varchar('version', { length: 50 }),
    ipHash: varchar('ip_hash', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('downloads_agent_id_created_at_idx').on(table.agentId, table.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

export const telemetry = pgTable('telemetry', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentId: uuid('agent_id').references(() => agents.id),
  version: varchar('version', { length: 50 }),
  success: boolean('success'),
  durationMs: integer('duration_ms'),
  errorType: varchar('error_type', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
