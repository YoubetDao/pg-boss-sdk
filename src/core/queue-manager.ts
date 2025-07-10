import PgBoss from 'pg-boss';
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import {
  QueueSDKConfig,
  JobOptions,
  WorkerOptions,
  JobHandler,
  JobHandlerMetadata,
  QueueMetrics,
  HealthStatus,
  JobStateInfo,
  JobInfo,
} from './types';

export class QueueManager extends EventEmitter {
  private boss: PgBoss;
  private readonly logger: Logger;
  private isInitialized = false;
  private initPromise: Promise<void>;
  private workers = new Map<string, string>();
  private handlers = new Map<string, JobHandlerMetadata>();
  private metrics = {
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    pendingJobs: 0,
    processingJobs: 0,
    averageProcessingTime: 0,
    queueSize: {} as Record<string, number>,
    errorRate: 0,
    throughput: 0,
  };

  constructor(
    private readonly config: QueueSDKConfig,
    private readonly customLogger?: Logger,
  ) {
    super();
    this.logger = customLogger || new Logger('QueueManager');

    this.boss = new PgBoss({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
      schema: config.database.schema || 'pgboss',
      application_name: config.database.application_name || 'queue-sdk',
      ssl: config.database.ssl,
    });

    this.setupEventHandlers();
    this.initPromise = this.initialize();
  }

  private setupEventHandlers(): void {
    this.boss.on('error', (error) => {
      this.logger.error('PgBoss error:', error);
      this.emit('error', error);
    });

    this.boss.on('stopped', () => {
      this.logger.info('PgBoss stopped');
      this.emit('stopped');
    });
  }

  private async initialize(): Promise<void> {
    try {
      this.logger.info('Starting QueueManager initialization...');

      await this.boss.start();

      // 等待表创建完成
      await new Promise((resolve) => setTimeout(resolve, 2000));

      this.isInitialized = true;
      this.logger.info('QueueManager initialized successfully');

      // 重新注册所有处理器
      for (const [queue, metadata] of this.handlers) {
        await this.registerWorker(queue, metadata.handler, metadata.options);
      }
    } catch (error) {
      this.logger.error('Failed to initialize QueueManager:', error);
      throw error;
    }
  }

  async waitForInitialization(): Promise<void> {
    if (!this.isInitialized) {
      await this.initPromise;
    }
  }

  async addJob<T extends object>(
    queue: string,
    data: T,
    options: JobOptions = {},
  ): Promise<string> {
    await this.waitForInitialization();

    try {
      this.logger.debug(`Adding job to queue ${queue}:`, { data, options });

      // 确保队列存在
      await this.boss.createQueue(queue);

      const jobId = await this.boss.send(queue, data, {
        retryLimit: this.config.queue?.retryLimit || 3,
        retryDelay: this.config.queue?.retryDelay || 5000,
        ...options,
      });

      if (!jobId) {
        throw new Error('Failed to add job: received null jobId');
      }

      this.metrics.totalJobs++;
      this.metrics.pendingJobs++;
      this.updateQueueSize(queue, 1);

      this.logger.debug(`Job added successfully with ID: ${jobId}`);
      return jobId;
    } catch (error) {
      this.logger.error(`Failed to add job to queue ${queue}:`, error);
      throw error;
    }
  }

  async registerWorker<T>(
    queue: string,
    handler: JobHandler<T>,
    options: WorkerOptions = {},
  ): Promise<string> {
    await this.waitForInitialization();

    try {
      const wrappedHandler: PgBoss.WorkHandler<T> = async (jobs) => {
        const job = jobs[0];
        if (!job?.data) {
          this.logger.warn(`Invalid job received from queue ${queue}`);
          return;
        }

        const startTime = Date.now();
        this.metrics.processingJobs++;
        this.metrics.pendingJobs--;

        try {
          await handler(job.data);

          const processingTime = Date.now() - startTime;
          this.metrics.completedJobs++;
          this.metrics.processingJobs--;
          this.updateAverageProcessingTime(processingTime);
          this.updateQueueSize(queue, -1);

          this.emit('job:completed', job.id, queue, job.data);
        } catch (error) {
          this.metrics.failedJobs++;
          this.metrics.processingJobs--;
          this.updateErrorRate();

          this.logger.error(`Error processing job in queue ${queue}:`, error);
          this.emit('job:failed', job.id, queue, error);
          throw error;
        }
      };

      const workOptions: PgBoss.WorkOptions = {
        includeMetadata:
          options.includeMetadata ||
          this.config.queue?.includeMetadata ||
          false,
      };

      const workerId = await this.boss.work(queue, workOptions, wrappedHandler);

      this.workers.set(queue, workerId);
      this.handlers.set(queue, { queue, handler, options });

      this.logger.debug(
        `Worker registered for queue ${queue} with ID: ${workerId}`,
      );
      this.emit('worker:started', workerId, queue);

      return workerId;
    } catch (error) {
      this.logger.error(`Failed to register worker for queue ${queue}:`, error);
      throw error;
    }
  }

  async schedule<T extends object>(
    queue: string,
    data: T,
    cron: string,
    options: PgBoss.ScheduleOptions = {},
  ): Promise<string> {
    await this.waitForInitialization();

    try {
      const jobId = await this.boss.schedule(queue, cron, data, options);
      if (typeof jobId !== 'string') {
        throw new Error(`Failed to schedule job for queue ${queue}`);
      }

      this.logger.debug(`Scheduled job for queue ${queue} with ID: ${jobId}`);
      return jobId;
    } catch (error) {
      this.logger.error(`Failed to schedule job for queue ${queue}:`, error);
      throw error;
    }
  }

  async cancelJob(queue: string, jobId: string): Promise<boolean> {
    try {
      await this.boss.cancel(queue, jobId);
      this.logger.debug(`Cancelled job ${jobId} from queue ${queue}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }

  async completeJob(queue: string, jobId: string): Promise<boolean> {
    try {
      await this.boss.complete(queue, jobId);
      this.logger.debug(`Completed job ${jobId} from queue ${queue}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to complete job ${jobId}:`, error);
      return false;
    }
  }

  async getJobState(
    queue: string,
    jobId: string,
  ): Promise<JobStateInfo | null> {
    try {
      const job = await this.boss.getJobById(queue, jobId);

      if (!job) {
        return null;
      }

      return {
        status: job.state || null,
        startedOn: job.startedOn || null,
        createdOn: job.createdOn || null,
        completedOn: job.completedOn || null,
      };
    } catch (error) {
      this.logger.error(`Failed to get job state for ${jobId}:`, error);
      return null;
    }
  }

  async getQueues(): Promise<PgBoss.Queue[]> {
    await this.waitForInitialization();
    return await this.boss.getQueues();
  }

  async getMetrics(): Promise<QueueMetrics> {
    await this.waitForInitialization();

    try {
      // 计算吞吐量（每分钟处理的任务数）
      const timeWindow = 60000; // 1分钟
      this.metrics.throughput =
        this.metrics.completedJobs / (timeWindow / 1000);

      return {
        ...this.metrics,
        queueSize: this.metrics.queueSize,
      };
    } catch (error) {
      this.logger.error('Failed to get metrics:', error);
      return this.metrics;
    }
  }

  async getHealthStatus(): Promise<HealthStatus> {
    await this.waitForInitialization();

    try {
      const queues = await this.boss.getQueues();
      const metrics = await this.getMetrics();

      const status: HealthStatus = {
        status: 'healthy',
        database: {
          connected: this.isInitialized,
        },
        queues: {
          total: queues.length,
          active: queues.filter((q) => q.name !== '__pgboss__send-it').length,
        },
        workers: {
          total: this.workers.size,
          active: this.workers.size,
        },
        timestamp: new Date(),
      };

      // 检查错误率
      if (metrics.errorRate > 0.1) {
        // 10% 错误率阈值
        status.status = 'degraded';
      }

      // 检查数据库连接
      if (!this.isInitialized) {
        status.status = 'unhealthy';
        status.database.error = 'Not connected';
      }

      return status;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'unhealthy',
        database: {
          connected: false,
          error: errorMessage,
        },
        queues: {
          total: 0,
          active: 0,
          error: errorMessage,
        },
        workers: {
          total: 0,
          active: 0,
          error: errorMessage,
        },
        timestamp: new Date(),
      };
    }
  }

  async stop(): Promise<void> {
    if (this.isInitialized) {
      await this.boss.stop();
      this.isInitialized = false;
      this.logger.info('QueueManager stopped');
    }
  }

  private updateQueueSize(queue: string, delta: number): void {
    this.metrics.queueSize[queue] =
      (this.metrics.queueSize[queue] || 0) + delta;
    if (this.metrics.queueSize[queue] < 0) {
      this.metrics.queueSize[queue] = 0;
    }
  }

  private updateAverageProcessingTime(processingTime: number): void {
    const total = this.metrics.completedJobs;
    this.metrics.averageProcessingTime =
      (this.metrics.averageProcessingTime * (total - 1) + processingTime) /
      total;
  }

  private updateErrorRate(): void {
    const total = this.metrics.completedJobs + this.metrics.failedJobs;
    if (total > 0) {
      this.metrics.errorRate = this.metrics.failedJobs / total;
    }
  }

  async getJobInfo(queue: string, jobId: string): Promise<JobInfo | null> {
    try {
      const job = await this.boss.getJobById(queue, jobId);
      return job || null;
    } catch (error) {
      this.logger.error(`Failed to get job info for ${jobId}:`, error);
      return null;
    }
  }
}
