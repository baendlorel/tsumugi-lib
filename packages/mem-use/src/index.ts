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

interface MemoryUsage {
  /**
   * Name of the process, e.g. "node", "python", "chrome".
   */
  processName: string;

  pid: number;

  memory: number; // Physical/resident memory in bytes

  /**
   * `null` when not available on this platform. On Windows, this is the "private working set" which matches Task Manager's "内存" column (private resident memory). On other platforms, this may be unavailable or may require elevated permissions, so it's optional.
   */
  privateMemory: number | null; // null when not available on this platform

  /**
   * `null` when not available on this platform. Virtual memory size in bytes. May be unavailable on some platforms or require elevated permissions.
   */
  virtualMemory: number | null; // null when not available on this platform
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

type Handler = {
  [key in NodeJS.Platform]: () => MemoryUsage[];
};

const handler: Handler = {
  win32: () => {
    // Win32_PerfFormattedData_PerfProc_Process exposes WorkingSetPrivate which matches
    // the Task Manager "内存" column (private working set, not total working set).
    const result = execSync(
      'powershell.exe -Command "Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Select-Object Name, IDProcess, WorkingSetPrivate, PrivateBytes, VirtualBytes | ConvertTo-Json"',
    );
    return (JSON.parse(result.toString()) as ProcessInfo[]).map(fromProcessInfo);
  },
  cygwin: () => {
    // Cygwin runs on Windows; delegate to the same perf-counter query
    const result = execSync(
      'powershell.exe -Command "Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Select-Object Name, IDProcess, WorkingSetPrivate, PrivateBytes, VirtualBytes | ConvertTo-Json"',
    );
    return (JSON.parse(result.toString()) as ProcessInfo[]).map(fromProcessInfo);
  },
  linux: () => {
    // rss = resident set size (KB), vsz = virtual size (KB)
    return parseStandardPs('ps -eo pid,comm,rss,vsz');
  },
  darwin: () => {
    // -A = all processes, -o = custom columns
    return parseStandardPs('ps -A -o pid,comm,rss,vsz');
  },
  freebsd: () => {
    // -a = other users' processes, -x = no controlling terminal
    return parseStandardPs('ps -ax -o pid,comm,rss,vsz');
  },
  openbsd: () => {
    return parseStandardPs('ps -ax -o pid,comm,rss,vsz');
  },
  netbsd: () => {
    return parseStandardPs('ps -ax -o pid,comm,rss,vsz');
  },
  aix: () => {
    // AIX supports POSIX-style ps with -e (all processes) and -o (format)
    return parseStandardPs('ps -eo pid,comm,rss,vsz');
  },
  sunos: () => {
    // Solaris: fname is the 8-char process basename
    return parseStandardPs('ps -eo pid,fname,rss,vsz');
  },
  android: () => {
    // Android 7.0+ Bionic ps supports -A (all) and -o (format)
    return parseStandardPs('ps -A -o PID,NAME,RSS,VSZ');
  },
  haiku: () => {
    // Haiku's ps has no memory columns. `listarea <team_id>` is the only CLI source:
    //   - column 3 (size):  total reserved virtual address space in bytes
    //   - column 4 (alloc): actually committed/resident bytes
    // Strategy: collect PIDs from ps, then call listarea per team and sum both columns.
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
  },
};

export const getMemoryUsage = handler[platform()];
