import { Injectable } from '@nestjs/common';
import { QueueService, ProcessJob } from '../../src';

@Injectable()
export class MaintenanceService {
  constructor(private readonly queueService: QueueService) {}

  async scheduleDailyCleanup() {
    const jobId = await this.queueService.schedule(
      'maintenance-queue',
      { type: 'daily-cleanup' },
      '0 2 * * *' // Daily at 2 AM
    );
    
    console.log(`Daily cleanup scheduled with ID: ${jobId}`);
    return jobId;
  }

  async scheduleWeeklyBackup() {
    const jobId = await this.queueService.schedule(
      'maintenance-queue',
      { type: 'weekly-backup' },
      '0 3 * * 0' // Weekly on Sunday at 3 AM
    );
    
    console.log(`Weekly backup scheduled with ID: ${jobId}`);
    return jobId;
  }

  @ProcessJob('maintenance-queue')
  async processMaintenanceJob(data: any) {
    console.log('Processing maintenance job:', data);
    
    switch (data.type) {
      case 'daily-cleanup':
        await this.performDailyCleanup();
        break;
      case 'weekly-backup':
        await this.performWeeklyBackup();
        break;
      default:
        console.log('Unknown maintenance job type:', data.type);
    }
  }

  private async performDailyCleanup() {
    console.log('Starting daily cleanup...');
    
    // Simulate cleanup operations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Daily cleanup completed');
  }

  private async performWeeklyBackup() {
    console.log('Starting weekly backup...');
    
    // Simulate backup operations
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Weekly backup completed');
  }
} 