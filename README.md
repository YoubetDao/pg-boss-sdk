# queue-sdk

基于 [pg-boss](https://github.com/timgit/pg-boss) 的高性能队列 SDK，支持直接以 git submodule 方式集成到你的 TypeScript/NestJS 项目中。

---

## 特性

- 🚀 基于 pg-boss，可靠的 PostgreSQL 队列
- 🏗️ 支持 NestJS 集成（QueueService）
- ⏰ 支持延迟任务、定时任务（cron）
- 🔄 支持批量任务、重试机制
- 📊 队列状态与健康检查
- 🎯 TypeScript 类型安全

---

## 1. 以 Submodule 方式集成

### 步骤一：添加 submodule

```bash
git submodule add https://github.com/your-org/queue-sdk.git path/to/queue-sdk
git submodule update --init --recursive
```

### 步骤二：安装依赖

在主项目的 `package.json` 中添加 queue-sdk 依赖的包（如 pg-boss）：

```json
{
  "dependencies": {
    "pg-boss": "^8.0.0"
  }
}
```

### 步骤三：在主项目中引用

#### 纯 TypeScript 项目

```typescript
import { QueueManager } from './queue-sdk/src/core/queue-manager';
import { QueueSDKConfig } from './queue-sdk/src/core/types';

const config: QueueSDKConfig = {
  database: {
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    user: 'postgres',
    password: 'password',
  },
  // ...其他配置
};

const queue = new QueueManager(config);

await queue.addJob('my-queue', { foo: 'bar' });
await queue.registerWorker('my-queue', async (data) => {
  // 处理任务
});
```

#### NestJS 项目

```typescript
import { QueueService } from './queue-sdk/src/nestjs/queue.service';

@Injectable()
export class MyService {
  constructor(private readonly queueService: QueueService) {}

  async addTask() {
    await this.queueService.addJob('my-queue', { foo: 'bar' });
  }
}
```

---

## 2. API 参考

### QueueManager

- `addJob(queue, data, options?)`：添加任务（支持延迟、批量、重试等）
- `registerWorker(queue, handler, options?)`：注册任务消费者
- `schedule(queue, data, cron, options?)`：定时任务（cron表达式）
- `getJobState(queue, jobId)`：查询任务状态
- `cancelJob(queue, jobId)`：取消任务
- `getMetrics()`：获取队列统计信息
- `getHealthStatus()`：获取健康状态

### QueueService（NestJS）

- `addJob(queue, data, options?)`
- `registerWorker(queue, handler, options?)`
- `schedule(queue, data, cron, options?)`
- `getMetrics()`
- `getHealthStatus()`
- ...等

---

## 3. 配置说明

### QueueSDKConfig 示例

```typescript
const config: QueueSDKConfig = {
  database: {
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    user: 'postgres',
    password: 'password',
    // schema, application_name 可选
  },
  queue: {
    retryLimit: 3,
    retryDelay: 5000,
    // 其他队列参数
  },
  // monitoring 配置可选
};
```

---

## 4. 进阶用法

### 延迟任务

```typescript
await queue.addJob('delayed-queue', { foo: 'bar' }, { startAfter: new Date(Date.now() + 60000) }); // 1分钟后执行
```

### 定时任务

```typescript
await queue.schedule('cron-queue', { foo: 'bar' }, '0 2 * * *'); // 每天凌晨2点
```

### 批量任务

```typescript
const jobs = [{ foo: 1 }, { foo: 2 }];
for (const job of jobs) {
  await queue.addJob('batch-queue', job);
}
```

---

## 5. 单元测试与类型

- SDK 内部已包含类型声明，直接 import 使用。
- 建议主项目补充集成测试，确保队列功能与业务逻辑兼容。

---

## 6. 常见问题

- **依赖冲突**：请确保主项目和 queue-sdk 的依赖版本一致。
- **路径引用**：如需简化 import，可在主项目 tsconfig.json 配置 path alias。

---

## 7. License

MIT

---

如需更详细的API说明，请查阅源码注释或直接阅读`src/core/queue-manager.ts`与`src/nestjs/queue.service.ts`。 