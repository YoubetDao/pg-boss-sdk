import { Injectable } from '@nestjs/common';
import { QueueService, ProcessJob } from '../../src';

@Injectable()
export class EmailService {
  constructor(private readonly queueService: QueueService) {}

  async sendWelcomeEmail(userId: string) {
    const jobId = await this.queueService.addJob('email-queue', {
      type: 'welcome',
      userId,
      timestamp: new Date(),
    });
    
    console.log(`Welcome email job queued with ID: ${jobId}`);
    return jobId;
  }

  async sendNotificationEmail(userId: string, message: string) {
    const jobId = await this.queueService.addJob('email-queue', {
      type: 'notification',
      userId,
      message,
      timestamp: new Date(),
    });
    
    console.log(`Notification email job queued with ID: ${jobId}`);
    return jobId;
  }

  @ProcessJob('email-queue')
  async processEmailJob(data: any) {
    console.log('Processing email job:', data);
    
    // Simulate email sending
    await this.sendEmail(data);
    
    console.log(`Email sent successfully for user: ${data.userId}`);
  }

  private async sendEmail(data: any) {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (data.type === 'welcome') {
      console.log(`Sending welcome email to user ${data.userId}`);
    } else if (data.type === 'notification') {
      console.log(`Sending notification email to user ${data.userId}: ${data.message}`);
    }
  }
} 