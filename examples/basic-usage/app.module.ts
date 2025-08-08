import { Module } from '@nestjs/common';
import { QueueModule, ConfigLoader } from '../../src';
import { EmailService } from './email.service';
import { MaintenanceService } from './maintenance.service';

@Module({
  imports: [
    QueueModule.forRootAsync({
      useFactory: () => ConfigLoader.loadFromEnv(),
    }),
  ],
  providers: [EmailService, MaintenanceService],
})
export class AppModule {}
