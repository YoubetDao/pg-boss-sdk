import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { QUEUE_WORKER_METADATA, QueueWorkerMetadata } from './queue.decorator';
import { QueueService } from './queue.service';
import { WorkerOptions } from '../core/types';

@Injectable()
export class QueueHandlerDiscovery {
  private readonly logger = new Logger(QueueHandlerDiscovery.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly queueService: QueueService,
  ) {}

  async discoverAndRegisterHandlers() {
    this.logger.log('Discovering queue handlers...');

    const providers = this.discoveryService.getProviders();
    const controllers = this.discoveryService.getControllers();

    const allInstances = [...providers, ...controllers];

    for (const wrapper of allInstances) {
      const { instance, metatype } = wrapper;

      if (!instance || !metatype) {
        continue;
      }

      // 扫描实例的所有方法
      this.metadataScanner.scanFromPrototype(
        instance,
        Object.getPrototypeOf(instance),
        (methodKey: string) => {
          this.registerHandlerIfDecorated(instance, methodKey);
        },
      );
    }

    this.logger.log('Queue handler discovery completed');
  }

  private async registerHandlerIfDecorated(instance: any, methodKey: string) {
    const method = instance[methodKey];

    if (typeof method !== 'function') {
      return;
    }

    // 获取方法上的 @ProcessJob 装饰器元数据
    const metadata: QueueWorkerMetadata = this.reflector.get(
      QUEUE_WORKER_METADATA,
      method,
    );

    if (!metadata) {
      return;
    }

    const { queue, options = {} } = metadata;

    this.logger.log(
      `Found @ProcessJob handler: ${instance.constructor.name}.${methodKey} for queue: ${queue}`,
    );

    try {
      // 注册队列处理器
      const workerId = await this.queueService.registerWorker(
        queue,
        method.bind(instance),
        options as WorkerOptions,
      );

      this.logger.log(
        `Registered queue handler for queue '${queue}' with worker ID: ${workerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to register queue handler for queue '${queue}':`,
        error,
      );
    }
  }
}
