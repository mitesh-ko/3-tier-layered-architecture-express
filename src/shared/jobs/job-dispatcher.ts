import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { JobOptions, JobStatus } from './job.types.js';
import { JobRegistry } from './job-registry.js';
import { RedisManager } from '#config/redis.config.js';
import { logger } from '#config/logger.config.js';
import { DateUtil } from '#shared/utils/date.util.js';

export class JobDispatcher {
  private static defaultQueueName = 'app-tasks';
  private static bullQueue: Queue | null = null;
  private static inMemoryJobs = new Map<string, JobStatus<any>>();
  private static readonly MAX_IN_MEMORY_JOBS = 200;

  private static getQueue(): Queue | null {
    if (!RedisManager.isRedisEnabled()) {
      return null;
    }

    if (!this.bullQueue) {
      try {
        const connection = RedisManager.getConnectionOptions();
        this.bullQueue = new Queue(this.defaultQueueName, {
          connection,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: 100,
            removeOnFail: 500,
          },
        });

        logger.info({ queue: this.defaultQueueName }, 'Initialized BullMQ Queue with Redis');
      } catch (err) {
        logger.error({ err }, 'Failed to initialize BullMQ queue, falling back to in-memory');
        this.bullQueue = null;
      }
    }

    return this.bullQueue;
  }

  /**
   * Dispatch a task to the background queue.
   * Returns immediately with the generated Job ID.
   */
  public static async dispatch<TPayload = unknown>(
    jobName: string,
    payload: TPayload,
    options: JobOptions = {}
  ): Promise<string> {
    const queue = this.getQueue();

    // 1. Production Mode: BullMQ + Redis
    if (queue) {
      const job = await queue.add(jobName, payload, {
        delay: options.delay,
        attempts: options.attempts ?? 3,
        backoff: options.backoff ?? { type: 'exponential', delay: 2000 },
        priority: options.priority,
        jobId: options.jobId,
        removeOnComplete: options.removeOnComplete ?? 100,
        removeOnFail: options.removeOnFail ?? 500,
      });

      logger.info(
        { jobId: job.id, jobName, delay: options.delay, queue: this.defaultQueueName },
        '🚀 Dispatched job to BullMQ queue'
      );

      return job.id!;
    }

    // 2. Fallback Mode: In-Memory Asynchronous Execution (when Redis is disabled/offline)
    const jobId = options.jobId || randomUUID();
    const now = DateUtil.toTimestamp();

    const jobRecord: JobStatus = {
      id: jobId,
      name: jobName,
      state: options.delay ? 'delayed' : 'waiting',
      progress: 0,
      data: payload,
      attemptsMade: 0,
      createdAt: now,
    };

    this.saveInMemoryJob(jobRecord);

    logger.debug(
      { jobId, jobName, delay: options.delay },
      '🚀 Dispatched job to in-memory async background worker'
    );

    const executeTask = () => {
      setImmediate(async () => {
        const handler = JobRegistry.getHandler(jobName);
        if (!handler) {
          jobRecord.state = 'failed';
          jobRecord.failedReason = `No handler registered for job: '${jobName}'`;
          jobRecord.finishedAt = DateUtil.toTimestamp();
          logger.error({ jobId, jobName }, 'No handler registered for background job');
          return;
        }

        jobRecord.state = 'active';
        jobRecord.processedAt = DateUtil.toTimestamp();
        jobRecord.attemptsMade += 1;

        try {
          const result = await handler.handle(payload, {
            id: jobId,
            name: jobName,
            attemptsMade: jobRecord.attemptsMade,
            updateProgress: async (percent: number) => {
              jobRecord.progress = percent;
            },
          });

          jobRecord.state = 'completed';
          jobRecord.progress = 100;
          jobRecord.returnValue = result;
          jobRecord.finishedAt = DateUtil.toTimestamp();
        } catch (err: any) {
          jobRecord.state = 'failed';
          jobRecord.failedReason = err?.message || 'Unknown job failure';
          jobRecord.finishedAt = DateUtil.toTimestamp();
          logger.error({ jobId, jobName, err }, 'In-memory background job execution failed');
        }
      });
    };

    if (options.delay && options.delay > 0) {
      setTimeout(executeTask, options.delay);
    } else {
      executeTask();
    }

    return jobId;
  }

  /**
   * Track the current status of a background job by ID.
   */
  public static async getStatus(jobId: string): Promise<JobStatus | null> {
    const queue = this.getQueue();

    if (queue) {
      const job = await queue.getJob(jobId);
      if (!job) return null;

      const state = await job.getState();

      return {
        id: job.id!,
        name: job.name,
        state: state as any,
        progress: typeof job.progress === 'number' ? job.progress : 0,
        data: job.data,
        returnValue: job.returnvalue,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        createdAt: job.timestamp,
        processedAt: job.processedOn,
        finishedAt: job.finishedOn,
      };
    }

    return this.inMemoryJobs.get(jobId) || null;
  }

  /**
   * Graceful close of BullMQ Queue connection on shutdown
   */
  public static async close(): Promise<void> {
    if (this.bullQueue) {
      await this.bullQueue.close();
      this.bullQueue = null;
      logger.info('BullMQ queue closed gracefully');
    }
    this.inMemoryJobs.clear();
  }

  private static saveInMemoryJob(job: JobStatus): void {
    if (this.inMemoryJobs.size >= this.MAX_IN_MEMORY_JOBS) {
      const firstKey = this.inMemoryJobs.keys().next().value;
      if (firstKey) this.inMemoryJobs.delete(firstKey);
    }
    this.inMemoryJobs.set(job.id, job);
  }
}
