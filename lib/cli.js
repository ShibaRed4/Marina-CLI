import process from "node:process";
import readline from "node:readline";
import chalk from "chalk";

class PrettyCLI {
  constructor(appName) {
    this.appName = appName || "CLI";
    this.welcomeMessages = [];
    this.commands = {};
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "> ", // Set the custom prompt
    });
  }

  registerCommand(command, description, action) {
    this.commands[command] = { description, action };
  }

  addWelcomeMessages(messages) {
    for (let welcomeMessage of messages) {
      this.welcomeMessages.push(welcomeMessage);
    }
  }

  showWelcomeMessage() {
    console.log(chalk.bold.cyan(`\n✨ Welcome to ${this.appName}! ✨\n`));

    for (let message of this.welcomeMessages) {
      console.log(chalk.dim(message));
    }

    console.log("\n");
    console.log(chalk.bold(`Here are our available commands: \n`));
    for (const [key, value] of Object.entries(this.commands)) {
      console.log(`${chalk.bold.blue(key)}: ${value.description}`);
    }
  }

  showHelp() {
    console.log(chalk.bold("\nAvailable Commands:\n"));
    for (const [command, { description }] of Object.entries(this.commands)) {
      console.log(`${chalk.green(command)} - ${chalk.dim(description)}`);
    }
    console.log(chalk.dim("\nType 'exit' to quit the CLI.\n"));
  }

  handleCommand(command) {
    if (command === "help") {
      this.showHelp();
      return true;
    }

    if (command === "exit") {
      console.log(chalk.yellow("\n👋 Goodbye!\n"));
      process.exit(0);
    }

    const cmd = this.commands[command];
    if (cmd) {
      cmd.action();
      return true;
    } else {
      console.log(chalk.red(`\n❌ Unknown command: '${command}'`));
      console.log(chalk.dim("Type 'help' to see available commands.\n"));
      return false;
    }
  }

  /**
   * Prompts the user for input and returns the response as a Promise.
   * @param {string} question - The question to ask the user.
   * @returns {Promise<string>} - The user's response.
   */
  prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(chalk.blueBright(`${question} `), (answer) => {
        resolve(answer.trim());
      });
    });
  }

  start() {
    // Check if a command is passed via process.argv
    const args = process.argv.slice(2); // Skip the first two arguments (node and script path)
    if (args.length > 0) {
      const command = args[0];
      const handled = this.handleCommand(command);
      if (handled) return; // Exit if the command was handled
    }

    // If no command is passed, start the interactive CLI
    this.showWelcomeMessage();
    this.rl.prompt();

    this.rl.on("line", async (input) => {
      const trimmedInput = input.trim();
      await this.handleCommand(trimmedInput);
      this.rl.prompt();
    });
  }
}

export default PrettyCLI;