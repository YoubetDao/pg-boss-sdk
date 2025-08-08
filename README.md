# pg-boss SDK

NestJS SDK wrapper for PostgreSQL job queue management using pg-boss.

## Project Structure

```
queue-sdk/
├── packages/
│   └── pg-boss-sdk/        # Main SDK package
│       ├── src/             # Source code
│       │   ├── core/        # Core queue management
│       │   ├── nestjs/      # NestJS integration
│       │   └── utils/       # Utilities
│       └── dist/            # Compiled output
└── examples/                # Usage examples
```

## Package

**[@youbetdao/pg-boss-sdk](./packages/pg-boss-sdk)** - Production-ready SDK for [pg-boss](https://github.com/timgit/pg-boss) with NestJS decorators, dependency injection, and TypeScript support.

## Quick Start

```bash
# Install dependencies
pnpm install

# Build SDK
pnpm build:sdk

# Run tests
pnpm test:sdk

# Publish to GitHub Packages
pnpm publish:sdk
```

## Development

```bash
# Build all packages
pnpm build

# Watch mode
pnpm dev

# Lint
pnpm lint

# Format code
pnpm format
```

## Requirements

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 12
