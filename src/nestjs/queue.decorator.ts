import { SetMetadata } from '@nestjs/common';
import { WorkerOptions } from '../core/types';

export const QUEUE_WORKER_METADATA = 'queue:worker';

export interface QueueWorkerMetadata {
  queue: string;
  options?: WorkerOptions;
}

export const ProcessJob = (queue: string, options?: WorkerOptions) =>
  SetMetadata(QUEUE_WORKER_METADATA, { queue, options }); 