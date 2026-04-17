import { pkg } from './load-pkg.js';

function showHelp(): never {
  const flag = `
   ___                 _ _     _
  |_  |               (_) |   | |
    | | __ _ _ __  ___ _| |__ | | ___
    | |/ _\` | '_ \/ __| | '_ \| |/ _ \
/\__/ / (_| | | | \__ \ | |_) | |  __/
\____/ \__,_|_| |_|___/_|_.__/|_|\___|
  `;
  console.log(flag);
  console.log('用法: jansible [-o|--output 文件] (-e|--exec) "命令"');
  console.log('示例: jansible -e "ls -la"');
  console.log('示例: jansible -o result.txt -e "systemctl status nginx"');
  process.exit(1);
  throw new Error('Process exited'); // unreachable, but ensures no accessible endpoint
}

function showVersion(): never {
  console.log(pkg.name + ' ' + pkg.version);
  process.exit(1);
}

export const loadArgv = (): { outputFile: string | null; command: string } => {
  let outputFile: string | null = null;
  let command: string | null = null;
  let args: string[];
  if (process.argv[0] === 'jansible') {
    args = process.argv.slice(1);
  } else {
    args = process.argv.slice(2);
  }

  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
  }

  if (args.includes('-v') || args.includes('--version')) {
    showVersion();
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    // & 分类讨论
    if (arg === '-o' || arg === '--output') {
      outputFile = args[++i];
      continue;
    }
    if (arg.startsWith('-o')) {
      outputFile = arg.slice(2);
      continue;
    }
    if (arg.startsWith('--output=')) {
      outputFile = arg.slice(9);
      continue;
    }

    // -e 后面的内容是命令
    if (arg === '-e' || arg === '--exec') {
      command = args.slice(i + 1).join('');
      break;
    }
    if (arg.startsWith('-e') || arg.startsWith('--exec=')) {
      console.error('Please use -e "command" instead of -ecommand or --exec=command');
      process.exit(1);
    }
  }

  if (!command) {
    showHelp();
  }

  return {
    outputFile,
    command,
  };
};
