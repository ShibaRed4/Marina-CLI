import { createServer } from "vite";
import chalk from "chalk";
import process from "node:process";

export default (cli) => {
  cli.registerCommand(
    "serve",
    "Serves the web app and listens for changes using Vite.",
    async () => {
      try {
        console.log(chalk.cyan("🔍 Starting Vite development server..."));

        // Create and start the Vite dev server
        const server = await createServer({
          root: process.cwd(), // Set the root to the current working directory
          server: {
            port: 3000, // Specify the port
            watch: {
              usePolling: true,
              interval: 100
            }
          },
        });

        await server.listen();

        const info = server.config.server;
        console.clear();
        console.log(
          chalk.bold.greenBright(
            `\n✅ Marina development server is running at ${chalk.underline.cyan(
              `http://localhost:${info.port || 3000}`
            )}`
          )
        );

        // Handle graceful shutdown
        //const shutdown = async () => {
        //  console.log(chalk.yellow("\n👋 Shutting down Marina server..."));
        //  try {
        //    await server.close(); // Close the Vite server
        //    console.log(chalk.red("❌ Marina server stopped."));
        //    process.exit(0); // Exit the process
        //  } catch (error) {
        //    console.error(chalk.red("❌ Error during shutdown:"), error);
        //    process.exit(1); // Exit with an error code
        //  }
        //};
        //// Listen for termination signals
        //process.on("SIGINT", shutdown); // Handle Ctrl+C
        //process.on("SIGTERM", shutdown); // Handle termination signals
      } catch (error) {
        console.error(chalk.red("❌ Failed to start Marina server:"), error);
        process.exit(1);
      }
    }
  );
};