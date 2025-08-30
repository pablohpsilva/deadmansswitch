# Dead Man's Switch

A secure, decentralized Dead Man's Switch application built with modern web technologies and Nostr encryption.

## 🚀 Features

### Security & Privacy

- **Military-grade encryption** using NIP17 standard
- **Zero-knowledge architecture** - we never store your message content
- **Decentralized storage** across multiple Nostr relays
- **Client-side encryption** before any data transmission
- **PostgreSQL encryption** at rest and in transit

### Authentication

- **Dual authentication methods**:
  - Email-based with 24-hour temporary passwords
  - Nostr wallet integration
- **JWT-based sessions** with automatic expiration
- **Secure key management** with immediate wipe on export

### Email Management

- **Tier-based restrictions**:
  - **Free**: 2 emails, 2 recipients, 125-char subject, 2000-char content
  - **Premium**: 100 emails, 10 recipients, 300-char subject, 10000-char content
  - **Lifetime**: Same as Premium with one-time payment
- **Flexible scheduling**:
  - Inactivity-based (30, 45, 52 days or custom intervals)
  - Specific date/time scheduling
  - Indefinite postponement capability
- **Message preview and testing**

### Payment System

- **Stripe integration** with secure webhooks
- **Three tiers**: Free, Premium ($15/year), Lifetime ($60 one-time)
- **Subscription management** with cancel/reactivate options

### Nostr Integration

- **NIP17 gift wrap encryption** for maximum privacy
- **Custom relay configuration** per user
- **Automatic relay connectivity testing**
- **Decentralized message storage**

### Scheduling & Automation

- **Cron-based scheduling** with multiple check intervals
- **Smart email delivery** when deadlines are reached
- **Audit logging** for all critical actions
- **Automatic cleanup** of expired temporary passwords

## 🏗️ Architecture

### Frontend (`apps/web`)

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for modern UI design
- **tRPC** for type-safe API calls
- **BiomeJS** for linting and formatting
- **Vitest** for testing

### Backend (`apps/backend`)

- **Hono** framework for fast HTTP server
- **tRPC** for type-safe API endpoints
- **PostgreSQL** with Drizzle ORM
- **JWT** authentication with 24-hour expiration
- **Node-cron** for scheduling
- **Stripe** for payments
- **Nodemailer** for email delivery

### Database

- **PostgreSQL 16** with encryption at rest
- **Drizzle ORM** for type-safe database operations
- **Column-level encryption** for sensitive data
- **Docker Compose** for easy development

## 📁 Project Structure

```
deadmansswitch/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   ├── components/    # React components
│   │   │   └── lib/           # Utilities and tRPC setup
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   └── backend/               # Hono backend
│       ├── src/
│       │   ├── routes/        # tRPC routers
│       │   ├── db/            # Database schema and migrations
│       │   ├── lib/           # Auth and utilities
│       │   ├── services/      # Business logic services
│       │   └── cron/          # Scheduling jobs
│       ├── drizzle.config.ts
│       └── package.json
├── packages/                  # Shared packages (future)
├── docker-compose.yml         # PostgreSQL and Redis
├── turbo.json                 # Turborepo configuration
└── biome.json                 # Code quality configuration
```

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+
- **Docker** and Docker Compose

### 1. Clone and Install

```bash
git clone <repository-url>
cd deadmansswitch
pnpm install
```

### 2. Environment Setup

Copy the environment example and configure:

```bash
# Backend environment
cp apps/backend/environment.example apps/backend/.env
```

Edit `apps/backend/.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/deadmansswitch
POSTGRES_PASSWORD=your_password

# Security
JWT_SECRET=your-very-long-jwt-secret
ENCRYPTION_KEY=your-32-character-encryption-key

# Email Service (choose one)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Nostr
DEFAULT_NOSTR_RELAYS=wss://relay.damus.io,wss://nos.lol
```

### 3. Start Database

```bash
docker-compose up -d postgres redis
```

### 4. Database Migration

```bash
cd apps/backend
pnpm db:generate  # Generate initial migration
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed with test data (optional)
```

### 5. Start Development Servers

```bash
# Start both frontend and backend
pnpm dev
```

Or start individually:

```bash
# Backend (port 3001)
cd apps/backend && pnpm dev

# Frontend (port 3000)
cd apps/web && pnpm dev
```

## 🔧 Available Scripts

### Root Level

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all applications
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all code
- `pnpm format` - Format all code

### Backend Specific

- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with test data

## 🔐 Security Features

### Encryption

- **NIP17 encryption** for all message content
- **AES-256** encryption for sensitive database fields
- **Client-side encryption** before transmission
- **PostgreSQL TDE** for data at rest

### Authentication

- **24-hour temporary passwords** with no refresh capability
- **JWT tokens** with automatic expiration
- **Nostr signature verification** for wallet authentication
- **IP and user agent logging** for audit trails

### Privacy

- **Zero-knowledge architecture** - server never sees message content
- **Immediate key wiping** when users export Nostr keys
- **Decentralized storage** across multiple Nostr relays
- **No data retention** beyond necessary metadata

## 💰 Pricing Tiers

| Feature              | Free        | Premium ($15/year) | Lifetime ($60) |
| -------------------- | ----------- | ------------------ | -------------- |
| Max Emails           | 2           | 100                | 100            |
| Recipients per Email | 2           | 10                 | 10             |
| Subject Length       | 125 chars   | 300 chars          | 300 chars      |
| Content Length       | 2,000 chars | 10,000 chars       | 10,000 chars   |
| Scheduling           | Basic       | Advanced           | Advanced       |
| Support              | Community   | Priority           | Priority       |

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run frontend tests
cd apps/web && pnpm test

# Run backend tests
cd apps/backend && pnpm test
```

## 📝 API Documentation

The API is fully type-safe using tRPC. Key endpoints:

### Authentication

- `auth.requestEmailAuth` - Request temporary password
- `auth.loginWithEmail` - Login with temporary password
- `auth.loginWithNostr` - Login with Nostr wallet
- `auth.checkIn` - Update last check-in time
- `auth.exportNostrKeys` - Export and wipe Nostr keys

### Email Management

- `emails.createEmail` - Create encrypted email
- `emails.getEmails` - List user's emails
- `emails.updateEmail` - Update existing email
- `emails.deleteEmail` - Delete email
- `emails.getTierLimits` - Get user's tier limits

### Nostr Relays

- `nostr.addRelay` - Add custom relay
- `nostr.testRelay` - Test relay connectivity
- `nostr.getRelays` - Get user's configured relays

### Payments

- `payments.createPremiumCheckout` - Create Stripe session
- `payments.getSubscription` - Get subscription status
- `payments.cancelSubscription` - Cancel subscription

## 🚀 Deployment

### Production Environment Variables

```env
NODE_ENV=production
DATABASE_URL=your-production-db-url
JWT_SECRET=your-production-jwt-secret
ENCRYPTION_KEY=your-production-encryption-key
STRIPE_SECRET_KEY=sk_live_your-live-key
# ... other production configs
```

### Build Commands

```bash
pnpm build          # Build all apps
pnpm start          # Start production servers
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🛟 Support

For support, please visit our help center or contact support@deadmansswitch.com.

---

Built with ❤️ using modern web technologies and a privacy-first approach.
