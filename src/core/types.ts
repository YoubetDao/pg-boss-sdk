import * as PgBoss from 'pg-boss';

// 数据库配置
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  schema?: string;
  application_name?: string;
}

// 队列配置
export interface QueueConfig {
  retryLimit?: number;
  retryDelay?: number;
  teamSize?: number;
  teamConcurrency?: number;
  interval?: number;
  includeMetadata?: boolean;
}

// 任务选项
export interface JobOptions extends PgBoss.SendOptions {
  singletonKey?: string;
  expireInSeconds?: number;
}

// 工作进程选项
export interface WorkerOptions {
  newJobCheckInterval?: number;
  singletonKey?: string;
  retryLimit?: number;
  retryDelay?: number;
  interval?: number;
  teamSize?: number;
  teamConcurrency?: number;
  includeMetadata?: boolean;
}

// 监控配置
export interface MonitoringConfig {
  enabled: boolean;
  metricsPort?: number;
  healthCheckInterval?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// 主配置
export interface QueueSDKConfig {
  database: DatabaseConfig;
  queue?: QueueConfig;
  monitoring?: MonitoringConfig;
}

// 队列指标
export interface QueueMetrics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  processingJobs: number;
  averageProcessingTime: number;
  queueSize: Record<string, number>;
  errorRate: number;
  throughput: number;
}

// 健康检查状态
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  database: {
    connected: boolean;
    error?: string;
  };
  queues: {
    total: number;
    active: number;
    error?: string;
  };
  workers: {
    total: number;
    active: number;
    error?: string;
  };
  timestamp: Date;
}

// 任务处理器类型
export type JobHandler<T = any> = (data: T) => Promise<void>;

// 任务处理器元数据
export interface JobHandlerMetadata {
  queue: string;
  handler: JobHandler;
  options?: WorkerOptions;
}

// 事件类型
export interface QueueEvents {
  'job:completed': (jobId: string, queue: string, data: any) => void;
  'job:failed': (jobId: string, queue: string, error: Error) => void;
  'job:retry': (jobId: string, queue: string, attempt: number) => void;
  'worker:started': (workerId: string, queue: string) => void;
  'worker:stopped': (workerId: string, queue: string) => void;
  'queue:created': (queue: string) => void;
  'queue:deleted': (queue: string) => void;
}
