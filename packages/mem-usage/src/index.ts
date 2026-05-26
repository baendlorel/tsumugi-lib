import { execSync } from 'node:child_process';
import { platform } from 'node:os';

// Intermediate type matching Win32_PerfFormattedData_PerfProc_Process fields (Windows only)
interface ProcessInfo {
  Name: string; // process name (may have #2, #3 suffix for duplicates)
  IDProcess: number;
  WorkingSetPrivate: number; // private working set = Task Manager "内存" column
  PrivateBytes: number; // private committed bytes (includes paged-out)
  VirtualBytes: number; // virtual address space
}

export interface MemoryUsage {
  /**
   * Name of the process, e.g. "node", "python", "chrome".
   */
  processName: string;

  pid: number;

  /**
   * Physical/resident memory in bytes
   */
  memory: number;

  /**
   * `null` when not available on this platform. On Windows, this is the "private working set" which matches Task Manager's "内存" column (private resident memory). On other platforms, this may be unavailable or may require elevated permissions, so it's optional.
   */
  privateMemory: number | null;

  /**
   * `null` when not available on this platform. Virtual memory size in bytes. May be unavailable on some platforms or require elevated permissions.
   */
  virtualMemory: number | null;
}

// Convert Windows intermediate type to the standard output type
function fromProcessInfo(p: ProcessInfo): MemoryUsage {
  return {
    // Strip the #2, #3 duplicate-instance suffix added by perf counters
    processName: p.Name.replace(/#\d+$/, ''),
    pid: p.IDProcess,
    memory: p.WorkingSetPrivate,
    privateMemory: p.PrivateBytes,
    virtualMemory: p.VirtualBytes,
  };
}

// Parse ps output with fixed columns: PID COMM/NAME RSS(KB) VSZ(KB)
// Header lines are skipped by checking if the first column is a number.
function parseStandardPs(cmd: string): MemoryUsage[] {
  const output = execSync(cmd).toString();
  const result: MemoryUsage[] = [];
  for (const line of output.trim().split('\n')) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 4) continue;
    const pid = parseInt(parts[0]);
    if (isNaN(pid)) continue;
    result.push({
      processName: parts[1],
      pid,
      memory: (parseInt(parts[2]) || 0) * 1024,
      privateMemory: null,
      virtualMemory: (parseInt(parts[3]) || 0) * 1024,
    });
  }
  return result;
}

/**
 * Win32_PerfFormattedData_PerfProc_Process exposes WorkingSetPrivate which matches
 * the Task Manager "内存" column (private working set, not total working set).
 */
const win32 = () => {
  const result = execSync(
    'powershell.exe -Command "Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Select-Object Name, IDProcess, WorkingSetPrivate, PrivateBytes, VirtualBytes | ConvertTo-Json"',
  );
  return (JSON.parse(result.toString()) as ProcessInfo[]).map(fromProcessInfo);
};

/**
 * Cygwin runs on Windows; delegate to the same perf-counter query
 */
const cygwin = () => {
  const result = execSync(
    'powershell.exe -Command "Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Select-Object Name, IDProcess, WorkingSetPrivate, PrivateBytes, VirtualBytes | ConvertTo-Json"',
  );
  return (JSON.parse(result.toString()) as ProcessInfo[]).map(fromProcessInfo);
};

/**
 * rss = resident set size (KB), vsz = virtual size (KB)
 */
const linux = () => parseStandardPs('ps -eo pid,comm,rss,vsz');
/**
 * -A = all processes, -o = custom columns
 */
const darwin = () => parseStandardPs('ps -A -o pid,comm,rss,vsz');

/**
 * -a = other users' processes, -x = no controlling terminal
 */
const freebsd = () => parseStandardPs('ps -ax -o pid,comm,rss,vsz');

const openbsd = () => parseStandardPs('ps -ax -o pid,comm,rss,vsz');

const netbsd = () => parseStandardPs('ps -ax -o pid,comm,rss,vsz');

/**
 * AIX supports POSIX-style ps with -e (all processes) and -o (format)
 */
const aix = () => parseStandardPs('ps -eo pid,comm,rss,vsz');

/**
 * Solaris: fname is the 8-char process basename
 */
const sunos = () => parseStandardPs('ps -eo pid,fname,rss,vsz');

/**
 * Android 7.0+ Bionic ps supports -A (all) and -o (format)
 */
const android = () => parseStandardPs('ps -A -o PID,NAME,RSS,VSZ');

/**
 * Haiku's ps has no memory columns. `listarea <team_id>` is the only CLI source:
 *   - column 3 (size):  total reserved virtual address space in bytes
 *   - column 4 (alloc): actually committed/resident bytes
 * Strategy: collect PIDs from ps, then call listarea per team and sum both columns.
 */
const haiku = () => {
  const psOutput = execSync('ps').toString();
  const result: MemoryUsage[] = [];

  for (const line of psOutput.trim().split('\n')) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    const pid = parseInt(parts[0]);
    if (isNaN(pid)) continue;

    let memory = 0;
    let virtualMemory = 0;
    try {
      const areaOutput = execSync(`listarea ${pid}`).toString();
      for (const areaLine of areaOutput.split('\n')) {
        // Format: <id> '<name>' <size> <alloc> <pages> ...
        const m = areaLine.match(/^\s*\d+\s+'[^']*'\s+(\d+)\s+(\d+)/);
        if (m) {
          virtualMemory += parseInt(m[1]); // size  = virtual
          memory += parseInt(m[2]); // alloc = resident
        }
      }
    } catch {
      // Some system teams may be inaccessible
    }

    result.push({ processName: parts[1], pid, memory, privateMemory: null, virtualMemory });
  }

  return result;
};

/**
 * Returns an array of memory usage info for all processes on the current system.
 * @param platform Defaults to current platform. _hard to find a reason for_
 */
let getMemoryUsage: () => MemoryUsage[];
switch (platform()) {
  case 'win32':
    getMemoryUsage = win32;
    break;
  case 'cygwin':
    getMemoryUsage = cygwin;
    break;
  case 'linux':
    getMemoryUsage = linux;
    break;
  case 'darwin':
    getMemoryUsage = darwin;
    break;
  case 'freebsd':
    getMemoryUsage = freebsd;
    break;
  case 'openbsd':
    getMemoryUsage = openbsd;
    break;
  case 'netbsd':
    getMemoryUsage = netbsd;
    break;
  case 'aix':
    getMemoryUsage = aix;
    break;
  case 'sunos':
    getMemoryUsage = sunos;
    break;
  case 'android':
    getMemoryUsage = android;
    break;
  case 'haiku':
    getMemoryUsage = haiku;
    break;
  default:
    console.error(`Unsupported platform: ${platform()}, returning linux version as fallback.`);
    getMemoryUsage = linux;
}

export { getMemoryUsage };
