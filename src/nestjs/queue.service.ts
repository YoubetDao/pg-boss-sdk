import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { QueueManager } from '../core/queue-manager';
import { QueueSDKConfig, JobOptions, WorkerOptions, JobHandler } from '../core/types';
import { Logger } from '../utils/logger';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private queueManager: QueueManager;
  private readonly logger = new Logger('QueueService');

  constructor(
    @Inject('QUEUE_CONFIG') private readonly config: QueueSDKConfig,
  ) {
    this.queueManager = new QueueManager(config, this.logger);
  }

  async onModuleInit() {
    await this.queueManager.waitForInitialization();
    this.logger.info('QueueService initialized');
  }

  async onModuleDestroy() {
    await this.queueManager.stop();
    this.logger.info('QueueService stopped');
  }

  async addJob<T extends object>(
    queue: string,
    data: T,
    options: JobOptions = {},
  ): Promise<string> {
    return this.queueManager.addJob(queue, data, options);
  }

  async registerWorker<T>(
    queue: string,
    handler: JobHandler<T>,
    options: WorkerOptions = {},
  ): Promise<string> {
    return this.queueManager.registerWorker(queue, handler, options);
  }

  async schedule<T extends object>(
    queue: string,
    data: T,
    cron: string,
    options: any = {},
  ): Promise<string> {
    return this.queueManager.schedule(queue, data, cron, options);
  }

  async cancelJob(queue: string, jobId: string): Promise<boolean> {
    return this.queueManager.cancelJob(queue, jobId);
  }

  async completeJob(queue: string, jobId: string): Promise<boolean> {
    return this.queueManager.completeJob(queue, jobId);
  }

  async getJobState(queue: string, jobId: string): Promise<string | null> {
    return this.queueManager.getJobState(queue, jobId);
  }

  async getQueues() {
    return this.queueManager.getQueues();
  }

  async getMetrics() {
    return this.queueManager.getMetrics();
  }

  async getHealthStatus() {
    return this.queueManager.getHealthStatus();
  }

  // 获取底层队列管理器实例（用于高级用法）
  getQueueManager(): QueueManager {
    return this.queueManager;
  }
} 