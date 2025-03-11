import * as fengari from "fengari-web";
import { getLuaState, toLuaString, toJsString } from './lua-state.js';
import { exportService } from './service-registry.js';

const { lua, lauxlib, interop } = fengari;

// Cache for registered classes
const registeredClasses = new Map();

// Register a JavaScript class to be available in Lua
export function registerClass(luaName, jsClass) {
  try {
    const L = getLuaState();
    
    // Push to global table
    lua.lua_pushglobaltable(L);
    
    // Register the class
    interop.push(L, jsClass);
    lua.lua_setfield(L, -2, toLuaString(luaName));
    
    // Store in the cache
    registeredClasses.set(luaName, jsClass);
    
    // Pop global table
    lua.lua_pop(L, 1);
    
    console.log(`Successfully registered class ${luaName} in Lua environment`);
    
    return jsClass;
  } catch (error) {
    console.error(`Failed to register class ${luaName}:`, error);
    throw new Error(`Failed to register class ${luaName}: ${error.message}`);
  }
}

// Export a class as a service in the service registry
export function exportClassAsService(serviceName, jsClass) {
  // Register in internal class cache
  registeredClasses.set(serviceName, jsClass);
  
  // Also register in the service registry for enigma:import() access
  exportService(serviceName, jsClass);
  
  console.log(`Exported class ${serviceName} as a service`);
  
  return jsClass;
}

// Get a registered class by name
export function getRegisteredClass(luaName) {
  if (!registeredClasses.has(luaName)) {
    console.warn(`Class ${luaName} is not registered in the Lua environment`);
    return null;
  }
  return registeredClasses.get(luaName);
}

// Push a JavaScript value onto the Lua stack with detailed error handling
export function pushValue(value) {
  try {
    const L = getLuaState();
    
    if (value === null || value === undefined) {
      lua.lua_pushnil(L);
      return;
    }
    
    // Handle different value types
    if (typeof value === "object" || typeof value === "function") {
      interop.push(L, value);
      
      // Verify the push was successful
      if (lua.lua_isnil(L, -1) && value !== null) {
        console.warn(`Value of type ${typeof value} was pushed as nil, which might indicate an interop issue`);
      }
    } 
    else if (typeof value === "string") {
      lua.lua_pushstring(L, toLuaString(value));
    } 
    else if (typeof value === "number") {
      lua.lua_pushnumber(L, value);
    } 
    else if (typeof value === "boolean") {
      lua.lua_pushboolean(L, value);
    } 
    else {
      console.warn(`Pushing nil for unsupported value type: ${typeof value}`);
      lua.lua_pushnil(L);
    }
    
    // Debug info
    const type = lua.lua_type(L, -1);
    const typeNames = {
      [lua.LUA_TNIL]: "nil",
      [lua.LUA_TBOOLEAN]: "boolean",
      [lua.LUA_TLIGHTUSERDATA]: "lightuserdata",
      [lua.LUA_TNUMBER]: "number",
      [lua.LUA_TSTRING]: "string",
      [lua.LUA_TTABLE]: "table",
      [lua.LUA_TFUNCTION]: "function",
      [lua.LUA_TUSERDATA]: "userdata",
      [lua.LUA_TTHREAD]: "thread"
    };
    //console.log(`Pushed value of JS type "${typeof value}" as Lua type "${typeNames[type] || type}"`);
    
  } catch (error) {
    console.error(`Error pushing value to Lua stack:`, error);
    // Push nil as fallback
    const L = getLuaState();
    lua.lua_pushnil(L);
  }
}

// Convert a Lua value at the given stack index to a JavaScript value with better error handling
export function toJs(index) {
  try {
    const L = getLuaState();
    
    // Check if the index is valid
    if (index > 0 && index > lua.lua_gettop(L)) {
      throw new Error(`Invalid stack index: ${index}, stack size is ${lua.lua_gettop(L)}`);
    }
    
    // Get the Lua type at the given index
    const type = lua.lua_type(L, index);
    const typeNames = {
      [lua.LUA_TNIL]: "nil",
      [lua.LUA_TBOOLEAN]: "boolean",
      [lua.LUA_TLIGHTUSERDATA]: "lightuserdata",
      [lua.LUA_TNUMBER]: "number",
      [lua.LUA_TSTRING]: "string",
      [lua.LUA_TTABLE]: "table",
      [lua.LUA_TFUNCTION]: "function",
      [lua.LUA_TUSERDATA]: "userdata",
      [lua.LUA_TTHREAD]: "thread"
    };
    
    //console.log(`Converting Lua value of type "${typeNames[type] || type}" to JS`);
    
    // Special handling for common types
    if (type === lua.LUA_TNIL) {
      return null;
    } else if (type === lua.LUA_TBOOLEAN) {
      return Boolean(lua.lua_toboolean(L, index));
    } else if (type === lua.LUA_TNUMBER) {
      return lua.lua_tonumber(L, index);
    } else if (type === lua.LUA_TSTRING) {
      return toJsString(lua.lua_tostring(L, index));
    }
    
    // Use Fengari's interop for complex types
    return interop.tojs(L, index);
  } catch (error) {
    console.error(`Error converting Lua value to JS:`, error);
    return null;
  }
}

// Helper function to call a Lua function by name from a referenced table
export function callLuaFunction(moduleRef, funcName, ...args) {
  const L = getLuaState();
  
  try {
    // Push the module table onto the stack
    lua.lua_rawgeti(L, lua.LUA_REGISTRYINDEX, moduleRef);
    
    if (!lua.lua_istable(L, -1)) {
      throw new Error(`Module reference ${moduleRef} is not a valid table`);
    }
    
    // Get the function from the table
    lua.lua_getfield(L, -1, toLuaString(funcName));
    
    if (!lua.lua_isfunction(L, -1)) {
      throw new Error(`"${funcName}" is not a function in the Lua module`);
    }
    
    // Remove the module table, keeping only the function
    lua.lua_remove(L, -2);
    
    // Push arguments
    for (const arg of args) {
      pushValue(arg);
    }
    
    // Call the function with the correct number of arguments
    const numReturns = 1;
    const callResult = lua.lua_pcall(L, args.length, numReturns, 0);
    
    if (callResult !== lua.LUA_OK) {
      const errorMsg = toJsString(lua.lua_tostring(L, -1));
      throw new Error(`Error calling Lua function "${funcName}": ${errorMsg}`);
    }
    
    // Get the return value
    const returnValue = toJs(-1);
    
    // Pop the return value
    lua.lua_pop(L, 1);
    
    return returnValue;
  } catch (error) {
    console.error(`Error in callLuaFunction:`, error);
    
    // Clean up the stack in case of error
    const top = lua.lua_gettop(L);
    if (top > 0) {
      lua.lua_pop(L, top);
    }
    
    throw error;
  }
}

// Add a helpful debug function that can be called from Lua
export function setupDebugHelpers() {
  const L = getLuaState();
  
  // Push global table
  lua.lua_pushglobaltable(L);
  
  // Add debug.inspect function to examine JS objects
  const inspectFunc = function(obj) {
    console.log("Lua inspect:", obj);
    
    if (obj === null || obj === undefined) {
      return `${obj} (${typeof obj})`;
    }
    
    if (typeof obj === "object") {
      try {
        // Try to get all properties
        const props = Object.getOwnPropertyNames(obj);
        const methods = props.filter(p => typeof obj[p] === "function");
        const properties = props.filter(p => typeof obj[p] !== "function");
        
        return {
          type: obj.constructor ? obj.constructor.name : typeof obj,
          methods: methods,
          properties: properties.map(p => `${p}: ${typeof obj[p]}`)
        };
      } catch (e) {
        return `Error inspecting object: ${e.message}`;
      }
    }
    
    return `${obj} (${typeof obj})`;
  };
  
  // Create debug table
  lua.lua_newtable(L);
  
  // Add inspect function
  interop.push(L, inspectFunc);
  lua.lua_setfield(L, -2, toLuaString("inspect"));
  
  // Set debug table
  lua.lua_setfield(L, -2, toLuaString("debug"));
  
  // Pop global table
  lua.lua_pop(L, 1);
  
  // Add debug helpers directly to Lua
  lauxlib.luaL_dostring(
    L,
    toLuaString(`
    -- Enhance error reporting
    function traceback(err)
      print("Lua Error: " .. tostring(err))
      print(debug.traceback("", 2))
      return err
    end
    
    -- Helper to safely call methods on JS objects
    function callJsMethod(obj, methodName, ...)
      if type(obj) ~= "table" and type(obj) ~= "userdata" then
        error("Expected object but got " .. type(obj), 2)
      end
      
      local method = obj[methodName]
      if type(method) ~= "function" then
        error("Method '" .. methodName .. "' is not a function, it's a " .. type(method), 2)
      end
      
      -- Call the method with the object as first parameter (self)
      return method(obj, ...)
    end
    `)
  );
  
  console.log("Debug helpers set up in Lua environment");
}

// Add this function to your existing interop.js file
// Add this function to your interop.js file
export function enhanceEventEmitterInstance(emitter) {
  if (!emitter || typeof emitter.emit !== 'function') {
    console.warn("Invalid EventEmitter instance provided");
    return emitter;
  }
  
  // Save the original emit method
  const originalEmit = emitter.emit;
  
  // Replace the emit method with our enhanced version
  emitter.emit = function(event, ...args) {
    console.log(`Emitting event: ${event} with args:`, args);
    
    // Process the arguments for better Lua compatibility
    const processedArgs = [];
    
    // First argument is usually the entity, keep it as is
    if (args.length > 0) {
      processedArgs.push(args[0]);
    }
    
    // Handle overlap object specially
    if (args.length > 1 && args[1] && typeof args[1] === 'object') {
      const overlap = args[1];
      // Add x and y values as separate parameters
      if (overlap.xOverlap !== undefined) {
        processedArgs.push(overlap.xOverlap);
      }
      if (overlap.yOverlap !== undefined) {
        processedArgs.push(overlap.yOverlap);
      }
    } else {
      // Add remaining args normally
      for (let i = 1; i < args.length; i++) {
        processedArgs.push(args[i]);
      }
    }
    
    // Call the original emit with processed args
    console.log("Processed args:", processedArgs);
    return originalEmit.call(this, event, ...processedArgs);
  };
  
  console.log("Enhanced EventEmitter instance");
  return emitter;
}



export function initInterop(){
  setupDebugHelpers();
  enhanceEventEmitterInstance();
}