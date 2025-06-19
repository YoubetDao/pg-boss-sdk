import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async getHealth() {
    return this.queueService.getHealthStatus();
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  async getMetrics() {
    return this.queueService.getMetrics();
  }

  @Get('queues')
  @HttpCode(HttpStatus.OK)
  async getQueues() {
    return this.queueService.getQueues();
  }
} 