import { pkg } from './load-pkg.js';

function showHelp(code: number): never {
  const info = `
   ___                 _ _     _
  |_  |               (_) |   | |
    | | __ _ _ __  ___ _| |__ | | ___
    | |/ _\` | '_ \/ __| | '_ \| |/ _ \
/\__/ / (_| | | | \__ \ | |_) | |  __/
\____/ \__,_|_| |_|___/_|_.__/|_|\___|

jansible [-s|--sequential] [-o|--output filename] (-e|--exec) "command"
jansible -e "ls -la"
jansible -s -e "systemctl restart nginx"
jansible -o result.txt -e "systemctl status nginx"
  `;
  console.log(info);
  process.exit(code);
}

function showVersion(): never {
  console.log(pkg.name + ' ' + pkg.version);
  process.exit(0);
}

export const loadArgv = (): { outputFile: string | null; command: string; sequential: boolean } => {
  let outputFile: string | null = null;
  let command: string | null = null;
  let sequential = false;
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    showHelp(0);
  }

  if (args.includes('-v') || args.includes('--version')) {
    showVersion();
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-e' || arg === '--exec') {
      command = args.slice(i + 1).join(' ');
      break;
    }
    if (arg.startsWith('-e') || arg.startsWith('--exec=')) {
      console.error('Please use -e "command" instead of -ecommand or --exec=command');
      process.exit(1);
    }
    if (arg === '-s' || arg === '--sequential') {
      sequential = true;
      continue;
    }
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
    }
  }

  if (!command) {
    showHelp(1);
  }

  return {
    outputFile,
    command,
    sequential,
  };
};
