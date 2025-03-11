import { getLuaState, toLuaString, toJsString } from '../core/lua-state.js';

// Print Lua stack for debugging purposes
export function printLuaStack() {
  const L = getLuaState();
  const top = L.lua_gettop();
  
  console.log(`Lua stack contains ${top} elements:`);
  for (let i = 1; i <= top; i++) {
    const type = L.lua_type(i);
    const typeName = L.lua_typename(L, type);
    let value = 'unknown';
    
    switch (type) {
      case L.LUA_TSTRING:
        value = toJsString(L.lua_tostring(L, i));
        break;
      case L.LUA_TNUMBER:
        value = L.lua_tonumber(L, i);
        break;
      case L.LUA_TBOOLEAN:
        value = L.lua_toboolean(L, i) ? 'true' : 'false';
        break;
      case L.LUA_TNIL:
        value = 'nil';
        break;
      case L.LUA_TTABLE:
        value = 'table';
        break;
      case L.LUA_TFUNCTION:
        value = 'function';
        break;
      case L.LUA_TUSERDATA:
        value = 'userdata';
        break;
      case L.LUA_TTHREAD:
        value = 'thread';
        break;
    }
    
    console.log(`  ${i}: ${typeName} (${value})`);
  }
}

// Execute a Lua string and return any error
export function executeLuaString(code) {
  const L = getLuaState();
  
  const result = L.luaL_dostring(L, toLuaString(code));
  
  if (result !== L.LUA_OK) {
    const errorMsg = toJsString(L.lua_tostring(L, -1));
    L.lua_pop(L, 1);
    return { success: false, error: errorMsg };
  }
  
  return { success: true };
}