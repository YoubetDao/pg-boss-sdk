import { Module, DynamicModule, Global } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { QueueSDKConfig } from '../core/types';

@Global()
@Module({})
export class QueueModule {
  static forRoot(config: QueueSDKConfig): DynamicModule {
    return {
      module: QueueModule,
      providers: [
        {
          provide: 'QUEUE_CONFIG',
          useValue: config,
        },
        QueueService,
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
      providers: [
        {
          provide: 'QUEUE_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        QueueService,
      ],
      controllers: [QueueController],
      exports: [QueueService],
    };
  }
} 