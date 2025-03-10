import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import process from "node:process";

export default (cli) => {
  cli.registerCommand("init", "Starts a fresh new project!", async () => {
    console.clear()
    const projectName = await cli.prompt(
      chalk.cyanBright.bold("📦 Project Name: ")
    );

    // Define the source and destination paths
    const sourceDir = path.resolve("assets"); // Path to the "assets" folder
    const destDir = path.resolve(projectName); // Path to the new project folder

    // Check if the source directory exists
    if (!fs.existsSync(sourceDir)) {
      console.log(chalk.redBright(`\n❌ The "assets" folder does not exist.\n`));
      process.exit(1);
    }

    // Create the destination directory
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      console.log(
        chalk.greenBright(`\n✅ Created project folder: ${chalk.yellowBright(projectName)}\n`)
      );
    } else {
      console.log(
        chalk.yellowBright(
          `\n⚠️ Folder "${chalk.bold(projectName)}" already exists.\n`
        )
      );
    }

    // Function to copy files and directories recursively
    const copyRecursive = (src, dest) => {
      const entries = fs.readdirSync(src, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          // If the entry is a directory, create it in the destination and copy its contents
          if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
          }
          copyRecursive(srcPath, destPath);
        } else {
          // If the entry is a file, copy it to the destination
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };

    // Copy all files and directories from the source to the destination
    console.log(chalk.cyanBright("\n📂 Copying files..."));
    copyRecursive(sourceDir, destDir);

    // Create the marina.config.json file
    const defaultMarinaConfig = {
      projectName: projectName,
    };

    fs.writeFileSync(
      path.join(destDir, "marina.config.json"),
      JSON.stringify(defaultMarinaConfig, null, 2)
    );
    console.log(
      chalk.greenBright(`✅ Created ${chalk.bold("marina.config.json")}`)
    );

    // Create package.json
    const defaultPackageJson = {
      dependencies: {
        "fengari": "^0.1.4",
        "fengari-web": "^0.1.4",
      },
    };

    fs.writeFileSync(
      path.join(destDir, "package.json"),
      JSON.stringify(defaultPackageJson, null, 2)
    );
    console.log(
      chalk.greenBright(`✅ Created ${chalk.bold("package.json")}`)
    );

    // Final success message
    console.log(
      chalk.greenBright(
        `\n🎉 Project "${chalk.yellowBright(
          projectName
        )}" initialized successfully!\n`
      )
    );

    // Instructions for the user
    console.log(
      chalk.bold.cyanBright("🚀 Next steps:\n") +
        chalk.bold(`1️⃣  ${chalk.white("cd")} ${chalk.yellowBright(projectName)}\n`) +
        chalk.bold(`2️⃣  ${chalk.white("[npm|bun|yarn|deno|npx] install")}\n`) +
        chalk.bold(`3️⃣  ${chalk.white("marina serve")}\n`)
    );

    process.exit(0);
  });
};