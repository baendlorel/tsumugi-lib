/**
 * Cluster 通信协议类型定义
 */

export interface HostConfigPlain {
  ip: string;
  user: string;
  port: string;
  password: string;
}

/**
 * 主进程 -> Worker：任务列表消息
 */
export interface TasksMessage {
  type: 'tasks';
  payload: {
    hosts: HostConfigPlain[];
    command: string;
  };
}

/**
 * Worker -> 主进程：单个 SSH 执行完成的进度消息
 */
export interface ProgressMessage {
  type: 'progress';
  payload: {
    host: HostConfigPlain;
    success: boolean;
    stdout: string;
    stderr: string;
    code: number | null;
  };
}

/**
 * Worker -> 主进程：所有任务完成的消息
 */
export interface CompleteMessage {
  type: 'complete';
  payload: {
    total: number;
    successCount: number;
    failCount: number;
  };
}

/**
 * Worker 发送给主进程的消息类型
 */
export type WorkerToPrimaryMessage = ProgressMessage | CompleteMessage;

/**
 * 主进程发送给 Worker 的消息类型
 */
export type PrimaryToWorkerMessage = TasksMessage;
