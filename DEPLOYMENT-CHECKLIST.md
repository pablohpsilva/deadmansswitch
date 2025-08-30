# Production Deployment Checklist

Complete checklist for deploying your SSR-optimized Dead Man's Switch application to production.

## 🚀 Pre-Deployment Setup

### **Environment Configuration**

- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Configure `NODE_ENV=production`
- [ ] Set up proper JWT secrets and encryption keys
- [ ] Configure SMTP settings for your email server
- [ ] Set up database connection strings
- [ ] Configure Nostr relay endpoints

### **Build Optimization**

- [ ] Run `pnpm run analyze` to check bundle size
- [ ] Optimize images and static assets
- [ ] Review Core Web Vitals in development
- [ ] Test all SSR pages for performance
- [ ] Verify error boundaries work correctly

### **Security Checklist**

- [ ] Remove development environment variables
- [ ] Enable all security headers in `next.config.ts`
- [ ] Configure CSP (Content Security Policy)
- [ ] Set up HTTPS certificates
- [ ] Review API endpoint security
- [ ] Test authentication flows thoroughly

## 🏗️ Infrastructure Setup

### **Server Requirements**

- **Minimum**: 2 CPU cores, 4GB RAM, 20GB storage
- **Recommended**: 4 CPU cores, 8GB RAM, 50GB storage
- **Node.js**: Version 18 or higher
- **Database**: PostgreSQL with proper connection pooling

### **CDN Configuration**

```typescript
// next.config.ts optimizations
{
  images: {
    domains: ['your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // Static asset caching
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}
```

### **Database Optimization**

- [ ] Run all pending migrations
- [ ] Set up database indexes for performance
- [ ] Configure connection pooling
- [ ] Set up database backups
- [ ] Test under load

## 📊 Performance Monitoring

### **Core Web Vitals Targets**

- **First Contentful Paint**: < 1.5 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100 milliseconds
- **Interaction to Next Paint**: < 200 milliseconds

### **React Query Metrics**

- **Cache Hit Rate**: > 70%
- **Background Update Success**: > 95%
- **Error Rate**: < 1%
- **Offline Support**: 100% for cached data

### **Monitoring Tools Setup**

```typescript
// Add to your analytics
trackWebVitals({
  FCP: (metric) =>
    analytics.track("web_vital", { name: "FCP", value: metric.value }),
  LCP: (metric) =>
    analytics.track("web_vital", { name: "LCP", value: metric.value }),
  CLS: (metric) =>
    analytics.track("web_vital", { name: "CLS", value: metric.value }),
  FID: (metric) =>
    analytics.track("web_vital", { name: "FID", value: metric.value }),
});
```

## 🐳 Docker Deployment

### **Dockerfile**

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm install -g pnpm && pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### **Docker Compose**

```yaml
version: "3.8"

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_APP_URL=https://your-domain.com
      - DATABASE_URL=postgresql://user:pass@postgres:5432/deadmansswitch
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: deadmansswitch
      POSTGRES_USER: dbuser
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

## ☁️ Vercel Deployment

### **vercel.json**

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm run build",
  "devCommand": "pnpm run dev",
  "installCommand": "pnpm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### **Environment Variables**

```env
# Production environment variables
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=your-secure-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Email server configuration
SMTP_HOST=mail.your-domain.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASSWORD=your-email-password
FROM_EMAIL=noreply@your-domain.com

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

## 🔍 SEO Deployment

### **Search Console Setup**

- [ ] Submit sitemap to Google Search Console
- [ ] Verify domain ownership
- [ ] Set up monitoring for crawl errors
- [ ] Monitor Core Web Vitals
- [ ] Check mobile usability

### **Sitemap Generation**

```typescript
// app/sitemap.ts (auto-generated by Next.js)
export default function sitemap() {
  return [
    {
      url: "https://your-domain.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://your-domain.com/auth/login",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Add more URLs as needed
  ];
}
```

### **Robots.txt**

```
# app/robots.ts
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/'],
    },
    sitemap: 'https://your-domain.com/sitemap.xml',
  };
}
```

## 📈 Performance Testing

### **Load Testing**

```bash
# Test with Artillery or similar
artillery quick --count 100 --num 10 https://your-domain.com

# Lighthouse CI for automated testing
npx lhci autorun
```

### **Bundle Analysis**

```bash
# Analyze bundle size
ANALYZE=true pnpm run build

# Check for unused dependencies
npx depcheck

# Security audit
pnpm audit
```

## 🛡️ Security Deployment

### **SSL/TLS Configuration**

- [ ] Install SSL certificates (Let's Encrypt recommended)
- [ ] Configure HTTPS redirects
- [ ] Set up HSTS headers
- [ ] Test SSL configuration with SSL Labs

### **Security Headers**

```typescript
// Additional security headers for production
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
}
```

## 📱 Mobile Optimization

### **PWA Configuration** (Optional)

```typescript
// app/manifest.ts
export default function manifest() {
  return {
    name: "Dead Mans Switch",
    short_name: "DMS",
    description: "Secure, decentralized message service",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      // Add more icon sizes
    ],
  };
}
```

## 🔄 Continuous Deployment

### **GitHub Actions** (Example)

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile
      - run: pnpm run type-check
      - run: pnpm run lint
      - run: pnpm run test
      - run: pnpm run build

      # Deploy to your hosting provider
      - name: Deploy to Production
        run: |
          # Your deployment commands here
```

## 📊 Post-Deployment Monitoring

### **Health Checks**

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
  });
}
```

### **Error Tracking**

```typescript
// Global error tracking
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  // Send to error tracking service
});

window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  // Send to error tracking service
});
```

## 🎯 Success Metrics

### **Technical Metrics**

- [ ] **Lighthouse Score**: > 90 across all categories
- [ ] **First Byte Time**: < 200ms
- [ ] **Bundle Size**: < 500KB initial JavaScript
- [ ] **SSR Coverage**: > 90% of critical content

### **User Experience Metrics**

- [ ] **Bounce Rate**: < 40%
- [ ] **Session Duration**: > 2 minutes
- [ ] **Error Rate**: < 1%
- [ ] **Mobile Performance**: Equal to desktop

### **Business Metrics**

- [ ] **Conversion Rate**: Improved signup flow
- [ ] **User Retention**: Better with faster loading
- [ ] **Support Tickets**: Reduced with better UX
- [ ] **SEO Traffic**: Increased organic discovery

## 🚨 Emergency Procedures

### **Rollback Plan**

```bash
# Quick rollback procedure
git revert HEAD~1  # Revert last commit
pnpm run build    # Rebuild application
# Deploy previous version
```

### **Monitoring Alerts**

- [ ] Set up uptime monitoring
- [ ] Configure error rate alerts
- [ ] Monitor Core Web Vitals degradation
- [ ] Set up database performance alerts

### **Incident Response**

1. **Immediate**: Check health endpoints
2. **Investigate**: Review error logs and metrics
3. **Communicate**: Update status page if needed
4. **Resolve**: Apply fixes or rollback
5. **Post-mortem**: Document lessons learned

## ✅ Final Verification

### **Functional Testing**

- [ ] User registration/login works
- [ ] Email CRUD operations function correctly
- [ ] Payment processing works (if applicable)
- [ ] Email delivery works with your SMTP server
- [ ] Nostr integration functions properly

### **Performance Testing**

- [ ] Page load times under 2 seconds
- [ ] Mobile performance equivalent to desktop
- [ ] SSR content renders immediately
- [ ] Client-side navigation is instant
- [ ] Offline functionality works

### **Security Testing**

- [ ] Authentication cannot be bypassed
- [ ] API endpoints require proper authorization
- [ ] Input validation prevents injection attacks
- [ ] File uploads are properly validated
- [ ] Rate limiting is in place

## 🎉 Go Live!

Once all checklist items are complete:

1. **Final Build**: `pnpm run build:production`
2. **Deploy**: Push to your hosting platform
3. **Monitor**: Watch metrics for first 24 hours
4. **Optimize**: Adjust based on real-world performance
5. **Scale**: Add more resources as needed

Your Dead Man's Switch application is now production-ready with enterprise-level SSR, React Query optimization, and comprehensive monitoring! 🚀

## 📞 Support Resources

### **Documentation**

- SSR Implementation Guide
- React Query Integration Guide
- Email Server Setup Guide
- Nostr Security Guide

### **Monitoring Dashboards**

- Next.js Analytics
- React Query DevTools (development)
- Database performance metrics
- Email delivery statistics

### **Emergency Contacts**

- Infrastructure team
- Database administrators
- DNS/CDN providers
- Email service providers

This checklist ensures your deployment is robust, secure, and ready to scale with your user base!
