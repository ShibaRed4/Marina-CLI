import * as fengari from "fengari-web";

// Extract fengari components
const { lua, lauxlib, lualib, interop } = fengari;

// Global Lua state
let L = null;

// Initialize a new Lua state with all standard libraries
export function initLuaState(rootFolder) {
  if (L !== null) {
    return L; // Return existing state if already initialized
  }
  
  // Create a new Lua state
  L = lua.lua_newstate();
  lualib.luaL_openlibs(L);
  
  // Load the JavaScript library into Lua state
  interop.luaopen_js(L);
  
  // Set up custom package path if rootFolder is provided
  if (rootFolder) {
    setupPackagePath(rootFolder);
    
    // Also update the scripts root folder in module-loader
    import('./module-loader.js').then(moduleLoader => {
      if (moduleLoader.setScriptsRootFolder) {
        moduleLoader.setScriptsRootFolder(rootFolder);
      }
    });
  }
  
  return L;
}

// Get the current Lua state
export function getLuaState() {
  if (L === null) {
    throw new Error("Lua state not initialized. Call initLuaState first.");
  }
  return L;
}

// Setup Lua package path to include scripts directory
function setupPackagePath(rootFolder) {
  lauxlib.luaL_dostring(
    L,
    fengari.to_luastring(`
    -- Modify package.path to include the provided rootFolder
    package = package or {}
    package.path = "${rootFolder}/?.lua;" .. package.path
    print("Updated package.path: " .. package.path)
    `)
  );
}

// Convert JS string to Lua string
export function toLuaString(str) {
  return fengari.to_luastring(str);
}

// Convert Lua string to JS string
export function toJsString(luaStr) {
  return fengari.to_jsstring(luaStr);
}