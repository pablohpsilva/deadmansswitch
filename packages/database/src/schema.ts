import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  varchar,
  decimal,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique(),
  // Authentication method: 'email' users get generated keys, 'nostr' users bring their own
  authType: varchar("auth_type", { length: 20 }).notNull().default("email"), // email, nostr
  // Encrypted field for nostr private key (ONLY for email-authenticated users)
  nostrPrivateKey: text("nostr_private_key"), // encrypted, null for nostr-authenticated users
  nostrPublicKey: varchar("nostr_public_key", { length: 255 }),
  tempPassword: varchar("temp_password", { length: 255 }),
  tempPasswordExpires: timestamp("temp_password_expires"),
  tier: varchar("tier", { length: 20 }).notNull().default("free"), // free, premium, lifetime
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  subscriptionId: varchar("subscription_id", { length: 255 }),
  subscriptionStatus: varchar("subscription_status", { length: 50 }),
  subscriptionEnds: timestamp("subscription_ends"),
  lastCheckIn: timestamp("last_check_in").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const nostrRelays = pgTable("nostr_relays", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 500 }).notNull(),
  name: varchar("name", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deadmanEmails = pgTable("deadman_emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  // These fields are NOT stored - only metadata is kept
  // Actual content is encrypted and sent to Nostr relays
  title: varchar("title", { length: 255 }).notNull(),
  recipientCount: integer("recipient_count").notNull(),
  scheduledFor: timestamp("scheduled_for"),
  intervalDays: integer("interval_days"), // For check-in based emails
  isActive: boolean("is_active").notNull().default(true),
  isSent: boolean("is_sent").notNull().default(false),
  sentAt: timestamp("sent_at"),
  nostrEventId: varchar("nostr_event_id", { length: 255 }), // Reference to Nostr event
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emailRecipients = pgTable("email_recipients", {
  id: uuid("id").primaryKey().defaultRandom(),
  deadmanEmailId: uuid("deadman_email_id").references(() => deadmanEmails.id, {
    onDelete: "cascade",
  }),
  // Encrypted email address
  encryptedEmail: text("encrypted_email").notNull(),
  // Encrypted name (optional)
  encryptedName: text("encrypted_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const checkInLogs = pgTable("check_in_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pricing configuration tables
export const pricingTiers = pgTable("pricing_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull().unique(), // free, premium, lifetime
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  features: json("features").$type<string[]>().notNull(),
  maxEmails: integer("max_emails").notNull(),
  maxRecipients: integer("max_recipients").notNull(),
  maxSubjectLength: integer("max_subject_length").notNull(),
  maxContentLength: integer("max_content_length").notNull(),
  maxRelays: integer("max_relays").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull().unique(), // stripe, lightning, stablecoin
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // icon name for UI
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  requiresKyc: boolean("requires_kyc").notNull().default(false),
  includesTax: boolean("includes_tax").notNull().default(true),
  configuration: json("configuration").$type<Record<string, any>>(), // method-specific config
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pricingConfigurations = pgTable("pricing_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tierId: uuid("tier_id").references(() => pricingTiers.id, {
    onDelete: "cascade",
  }),
  paymentMethodId: uuid("payment_method_id").references(
    () => paymentMethods.id,
    { onDelete: "cascade" }
  ),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(), // in USD
  discountPercent: integer("discount_percent").notNull().default(0),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(), // calculated price after discount
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  interval: varchar("interval", { length: 20 }), // year, month, one-time
  stripeProductId: varchar("stripe_product_id", { length: 255 }),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  cryptoAmount: decimal("crypto_amount", { precision: 15, scale: 8 }), // for crypto payments
  cryptoUnit: varchar("crypto_unit", { length: 10 }), // sats, USD, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertNostrRelaySchema = createInsertSchema(nostrRelays);
export const selectNostrRelaySchema = createSelectSchema(nostrRelays);

export const insertDeadmanEmailSchema = createInsertSchema(deadmanEmails);
export const selectDeadmanEmailSchema = createSelectSchema(deadmanEmails);

export const insertEmailRecipientSchema = createInsertSchema(emailRecipients);
export const selectEmailRecipientSchema = createSelectSchema(emailRecipients);

export const insertPricingTierSchema = createInsertSchema(pricingTiers);
export const selectPricingTierSchema = createSelectSchema(pricingTiers);

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods);
export const selectPaymentMethodSchema = createSelectSchema(paymentMethods);

export const insertPricingConfigurationSchema = createInsertSchema(
  pricingConfigurations
);
export const selectPricingConfigurationSchema = createSelectSchema(
  pricingConfigurations
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type NostrRelay = typeof nostrRelays.$inferSelect;
export type NewNostrRelay = typeof nostrRelays.$inferInsert;

export type DeadmanEmail = typeof deadmanEmails.$inferSelect;
export type NewDeadmanEmail = typeof deadmanEmails.$inferInsert;

export type EmailRecipient = typeof emailRecipients.$inferSelect;
export type NewEmailRecipient = typeof emailRecipients.$inferInsert;

export type PricingTier = typeof pricingTiers.$inferSelect;
export type NewPricingTier = typeof pricingTiers.$inferInsert;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;

export type PricingConfiguration = typeof pricingConfigurations.$inferSelect;
export type NewPricingConfiguration = typeof pricingConfigurations.$inferInsert;
