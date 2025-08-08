# @youbetdao/pg-boss-sdk

NestJS SDK wrapper for pg-boss PostgreSQL job queue.

## Installation

```bash
pnpm add @youbetdao/pg-boss-sdk
```

## Usage

```typescript
import {
  QueueModule,
  QueueHandler,
  QueueService,
} from '@youbetdao/pg-boss-sdk';

// Configure in your app module
@Module({
  imports: [
    QueueModule.forRoot({
      connectionString: 'postgresql://user:pass@localhost:5432/db',
      enableWorker: true,
      enableScheduler: true,
    }),
  ],
})
export class AppModule {}

// Create job handlers
@QueueHandler('send-email')
export class EmailHandler {
  async handle(job: any) {
    console.log('Processing email:', job.data);
    // Your logic here
  }
}

// Send jobs
@Injectable()
export class EmailService {
  constructor(private readonly queueService: QueueService) {}

  async sendWelcomeEmail(userId: string) {
    await this.queueService.send('send-email', {
      userId,
      template: 'welcome',
    });
  }
}
```

## Features

- **PostgreSQL-based** - Reliable job persistence with pg-boss
- **NestJS Integration** - Decorators and dependency injection
- **Job Scheduling** - Cron expressions and delayed jobs
- **Retries & Dead Letter** - Automatic retry with exponential backoff
- **Job Monitoring** - Built-in health checks and metrics
- **TypeScript** - Full type safety and IntelliSense

## API

### Decorators

- `@QueueHandler(name)` - Mark a class as a job handler
- `@QueueController()` - Create queue management endpoints

### Services

- `QueueService` - Send and manage jobs
- `QueueManager` - Low-level queue operations

### Configuration

- `QueueModule.forRoot(options)` - Configure queue globally
- `QueueModule.forFeature(handlers)` - Register job handlers

## Requirements

- `@nestjs/common` ^11.0.0
- `@nestjs/core` ^11.0.0
- `pg-boss` ^10.0.0
- PostgreSQL 12+
