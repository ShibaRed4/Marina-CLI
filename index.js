import PrettyCLI from './lib/cli.js';
import initCommand from './commands/init.js';
import serveCommand from './commands/serve.js';
import compileCommand from './commands/compile.js'

const cli = new PrettyCLI('Marina');

// Add welcome messages
cli.addWelcomeMessages([
  'A lightweight and powerful CLI tool for the Marina Game Engine!',
]);

// Register commands
initCommand(cli);
serveCommand(cli);
compileCommand(cli)

// Start the CLI
cli.start();
