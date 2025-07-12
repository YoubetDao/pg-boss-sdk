import {
  QueueSDKConfig,
  DatabaseConfig,
  MonitoringConfig,
} from '../core/types';
import * as fs from 'fs';

export class ConfigLoader {
  static loadFromEnv(): QueueSDKConfig {
    const database: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_DATABASE || 'deepflow',
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      schema: process.env.DB_SCHEMA || 'pgboss',
      application_name: process.env.DB_APPLICATION_NAME || 'queue-sdk',
      ssl:
        process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
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
