import { Module, DynamicModule, Global, OnModuleInit } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { QueueHandlerDiscovery } from './queue-handler.discovery';
import { QueueSDKConfig } from '../core/types';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [QueueService, QueueHandlerDiscovery],
  controllers: [QueueController],
  exports: [QueueService],
})
export class QueueModule implements OnModuleInit {
  constructor(private readonly queueHandlerDiscovery: QueueHandlerDiscovery) {}

  async onModuleInit() {
    // 等待所有模块初始化完成后，发现并注册队列处理器
    setTimeout(async () => {
      await this.queueHandlerDiscovery.discoverAndRegisterHandlers();
    }, 1000);
  }

  static forRoot(config: QueueSDKConfig): DynamicModule {
    return {
      module: QueueModule,
      imports: [DiscoveryModule],
      providers: [
        {
          provide: 'QUEUE_CONFIG',
          useValue: config,
        },
        QueueService,
        QueueHandlerDiscovery,
      ],
      controllers: [QueueController],
      exports: [QueueService],
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<QueueSDKConfig> | QueueSDKConfig;
    inject?: any[];
  }): DynamicModule {
    return {
      module: QueueModule,
      imports: [DiscoveryModule],
      providers: [
        {
          provide: 'QUEUE_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        QueueService,
        QueueHandlerDiscovery,
      ],
      controllers: [QueueController],
      exports: [QueueService],
    };
  }
}
