import Game from "./Game";
import InstanceManager, { InstanceType } from "./InstanceManager";
import Render from "./Render";
import enigma from "../enigma/index.js";

const canvas = document.querySelector(".main");
const context = canvas.getContext("2d"); // Corrected type

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const Enigma = enigma.init("../src");
const MainRenderer = new Render(context); // Pass InputService and Player
const MainInstanceManager = new InstanceManager(MainRenderer);
const MainCamera = MainInstanceManager.new("Camera");
const MainGame = new Game(MainInstanceManager, context);

async function loadScripts() {
    // Dynamically import all Lua scripts from the src folder
    const pluginFiles = import.meta.glob("/src/**/*.lua", { query: "?raw" });
  
    console.log("Found Lua scripts:", Object.keys(pluginFiles));
  
    for (const filePath in pluginFiles) {
      try {
        // Prune the "/src/" part from the file path
        const prunedFilePath = filePath.replace("/src/", ""); // Remove "/src/" from the path
  
  
        // Load the raw Lua script content
        const scriptContent = await pluginFiles[filePath]();
  
        // Load the Lua script into Enigma
        const luaScript = await Enigma.loadScriptFromRoot(prunedFilePath);
  
        // Call the `init` function if it exists
        await luaScript.callFunction(
          "init",
          MainRenderer,
          MainInstanceManager,
          MainCamera
        );
  
        // Add the `onUpdate` function to the render loop if it exists
        MainRenderer.renderFunctions.push(
          async (deltaTime) =>
            await luaScript.callFunction(
              "onUpdate",
              MainRenderer,
              MainInstanceManager,
              MainCamera,
              deltaTime
            )
        );
      } catch (error) {
        console.error(`Error executing script from ${filePath}:`, error);
      }
    }
  }
  

// Call the function to load Lua scripts
loadScripts();

MainRenderer.renderFunctions.push((deltaTime) => {
  // Simulate physics after adjusting position
  const allInstances = MainInstanceManager.getInstances();

  for (let instance of allInstances) {
    if (instance.instanceType === InstanceType.Camera) continue;

    // Get the active camera (assuming there's only one camera)
    if (MainCamera) {
      // Calculate projected position and size based on the camera
      //@ts-ignore
      const zoomFactor = MainCamera.Zoom;

      // Projected Position: Adjust for camera position and zoom
      instance.ProjectedPosition = {
        x: (instance.Position.x - MainCamera.Position.x) * zoomFactor,
        y: (instance.Position.y - MainCamera.Position.y) * zoomFactor,
      };

      // Projected Size: Scale by zoom

      instance.ProjectedSize = {
        x: instance.Size.x * zoomFactor,
        y: instance.Size.y * zoomFactor,
      };
    } else {
      // If no camera, use original position and size
      instance.ProjectedPosition = { ...instance.Position };
      instance.ProjectedSize = { ...instance.Size };
    }
  }

  // Simulate physics
  MainGame.simulatePhysics(deltaTime);
});

MainRenderer.start();
