import {
  QueueSDKConfig,
  DatabaseConfig,
  MonitoringConfig,
} from '../core/types';
import * as fs from 'fs';

export class ConfigLoader {
  static loadFromEnv(
    postgresql_uri?: string,
    applicationName?: string,
  ): QueueSDKConfig {
    const uri = postgresql_uri || process.env.POSTGRESQL_URI;

    if (!uri) {
      throw new Error(
        'Database configuration not found. Please provide postgresql_uri parameter or set POSTGRESQL_URI environment variable.',
      );
    }

    const parsedUrl = new URL(uri);
    const searchParams = new URLSearchParams(parsedUrl.search);

    const database: DatabaseConfig = {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port || '5432'),
      database: parsedUrl.pathname.slice(1),
      user: parsedUrl.username,
      password: parsedUrl.password,
      schema: process.env.DB_SCHEMA || 'pgboss',
      application_name: applicationName || process.env.APPLICATION_NAME,
      ssl:
        searchParams.get('sslmode') === 'require'
          ? { rejectUnauthorized: false }
          : false,
    };

    const monitoring: MonitoringConfig = {
      enabled: process.env.QUEUE_MONITORING_ENABLED === 'true',
      metricsPort: parseInt(process.env.QUEUE_METRICS_PORT || '9090'),
      healthCheckInterval: parseInt(
        process.env.QUEUE_HEALTH_CHECK_INTERVAL || '30000',
      ),
      logLevel: (process.env.QUEUE_LOG_LEVEL as any) || 'info',
    };

    return {
      database,
      monitoring,
      queue: {
        retryLimit: parseInt(process.env.QUEUE_RETRY_LIMIT || '3'),
        retryDelay: parseInt(process.env.QUEUE_RETRY_DELAY || '5000'),
        teamSize: parseInt(process.env.QUEUE_TEAM_SIZE || '1'),
        teamConcurrency: parseInt(process.env.QUEUE_TEAM_CONCURRENCY || '1'),
        includeMetadata: process.env.QUEUE_INCLUDE_METADATA === 'true',
      },
    };
  }

  static loadFromFile(filePath: string): QueueSDKConfig {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to load config from file ${filePath}: ${errorMessage}`,
      );
    }
  }

  static validate(config: QueueSDKConfig): void {
    if (!config.database) {
      throw new Error('Database configuration is required');
    }

    if (!config.database.host) {
      throw new Error('Database host is required');
    }

    if (!config.database.port) {
      throw new Error('Database port is required');
    }

    if (!config.database.database) {
      throw new Error('Database name is required');
    }

    if (!config.database.user) {
      throw new Error('Database user is required');
    }

    if (!config.database.password) {
      throw new Error('Database password is required');
    }
  }
}
