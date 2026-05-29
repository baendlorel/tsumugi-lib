# total-lines

A lightweight CLI tool to count lines of code in your project.

## Installation

```bash
npm i -g total-lines
```

## Usage

```bash
# Count lines in current directory
lines .

# Count lines in a specific path
lines /path/to/project

# Count with verbose output (shows individual files)
lines -v /path/to/project

# Show version
lines -V

# Show help
lines -h
```

## Configuration

Create `~/.how-many-lines.json` to customize:

```json
{
  "suffix": [".ts", ".js", ".py", "go"],
  "exclude": ["**/node_modules", "**/dist", "**/*.md"]
}
```

### View Current Config

```bash
# Show supported file suffixes
lines config suffix

# Show exclusion patterns
lines config exclude

# Show config file format
lines config
```

## Features

- **Multi-language support**: 40+ file extensions supported by default
- **Smart exclusion**: Automatically excludes node_modules, dist, .git, etc.
- **Configurable**: Customize via config file
- **Verbose mode**: See per-file breakdown
- **Detailed output**: Lines grouped by file extension

## License

MIT
