import { build } from "vite";
import chalk from "chalk";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";

// Function to copy files and directories recursively
const copyRecursiveSync = (src, dest) => {
  if (!fs.existsSync(src)) {
    console.log(chalk.red(`❌ Source folder "${src}" does not exist.`));
    return;
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Ensure the destination directory exists
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyRecursiveSync(srcPath, destPath);
    } else {
      // Ensure the parent directory of the destination file exists
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

export default (cli) => {
  cli.registerCommand(
    "compile",
    "Compiles the project for production using Vite and copies the src folder.",
    async () => {
      try {
        console.clear();
        console.log(chalk.cyan("🔍 Starting production build..."));

        const projectDir = process.cwd();
        const srcDir = path.join(projectDir, "src");
        const distDir = path.join(projectDir, "dist");

        // Run the Vite build process
        await build({
          root: projectDir, // Set the root to the current working directory
          build: {
            outDir: "dist", // Output directory for the build
            emptyOutDir: true, // Clear the output directory before building
          },
          logLevel: "silent"
        });

        console.log(chalk.greenBright("\n✅ Marina build completed successfully!"));

        // Copy the src folder into the dist directory
        console.log(chalk.cyan("📂 Copying src folder to dist..."));
        copyRecursiveSync(srcDir, path.join(distDir, "src"));
        console.log(chalk.greenBright("✅ src folder copied successfully!"));

        console.log(
          chalk.bold.cyanBright(
            `\n📂 Your production build is available in the ${chalk.yellowBright(
              "dist"
            )} folder.\n`
          )
        );
        console.log('\n')
        process.exit(0)
      } catch (error) {
        console.error(chalk.red("❌ Failed to compile the project:"), error);
        process.exit(1);
      }
    }
  );
};