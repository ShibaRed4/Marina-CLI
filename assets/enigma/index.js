// Main entry point for the Enigma framework
import { initLuaState } from './core/lua-state.js';
import { registerClass } from './core/interop.js';
import { loadLuaScript, setScriptsRootFolder } from './core/module-loader.js';

// Export the main API
export default {
  // Initialize the framework
  init(rootFolder = 'src/scripts') {
    // Initialize Lua state with all standard libraries
    const L = initLuaState(rootFolder);
    
    // Set the root folder for script loading
    setScriptsRootFolder(rootFolder);
    
    return this;
  },
  
  // Set the root folder for scripts
  setScriptsRootFolder(folder) {
    setScriptsRootFolder(folder);
    return this;
  },
  
  // Register a custom class to be available in Lua
  registerClass(luaName, jsClass) {
    registerClass(luaName, jsClass);
    return this;
  },
  
  // Load and execute a Lua script - uses the exact path as provided
  async loadScript(scriptPath) {
    // The second parameter 'true' means use the exact path without modification
    return await loadLuaScript(scriptPath, true);
  },
  
  // Load and execute a Lua script relative to the configured root folder
  async loadScriptFromRoot(scriptPath) {
    // The second parameter 'false' means resolve the path relative to root folder
    return await loadLuaScript(scriptPath, false);
  }
};