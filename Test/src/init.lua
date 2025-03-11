-- Welcome to Marina! 
-- The web game framework that uses Lua!

-- Most game scripts for Marina have two very important functions: init() and onUpdate()
-- init() runs as soon as it's initialized, obviously.
-- onUpdate() runs every frame AFTER everything has rendered.

local Instance = enigma:import("Instance")
local Util = enigma:import("Util")
local InputService = enigma:import("InputService")

function toTable(jsArray)
    local result = {}
    local length = jsArray.length
    
    for i = 0, length - 1 do
       table.insert(result, jsArray[i])
    end
    
    return result
end

function inspectObject(obj)
    if obj == nil then
      print("Object is nil")
      return
    end
    
    print("Object type:", type(obj))
    
    if type(obj) == "table" then
      print("Table contents:")
      for k, v in pairs(obj) do
        print("  ", k, "=", v)
      end
    elseif type(obj) == "userdata" then
      print("Userdata object")
      -- Try to access some common properties
      pcall(function()
        print("  Trying x:", obj.x)
        print("  Trying y:", obj.y)
        print("  Trying xOverlap:", obj.xOverlap)
        print("  Trying yOverlap:", obj.yOverlap)
      end)
    end
  end

local firstScript = {}

firstScript.init = function(window)
    print("Running once!")
    local bg = Instance:new("Frame")
    bg.Texture = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSjfZjmMFBE7GGSKUO0gkh3bnHxEMJG_8iOw&s"
    bg.Size = Util:Vector2(window.innerWidth, window.innerHeight)

    local player = Instance:new("Part", "Player")
    player.Texture = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3Bf4VvpyB19UxD1oUK9npHMjPK-fPQaQnfw&s"
    player.Size = Util:Vector2(50,50)

    local testPlatform = Instance:new("Part", "Platform")
    testPlatform.Texture = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3Bf4VvpyB19UxD1oUK9npHMjPK-fPQaQnfw&s"
    testPlatform.Size = Util:Vector2(100,50)
    testPlatform.Position = Util:Vector2(0,100)
    testPlatform.Anchored = true

    player:on("Collided", function(otherEntity, overlap)
        print(otherEntity)
    end)
    

end

firstScript.onUpdate = function(deltaTime, window)
    local player = Instance:getInstance("Player")
    local pressedKeys = InputService:getPressedKeys()
    local keysTable = toTable(pressedKeys)
   
   -- Now you can use standard Lua iteration
   for i, key in ipairs(keysTable) do
      if key == "KeyD" then
        player.Velocity.x = 20
      elseif key == "KeyA" then
        player.Velocity.x = -20
      end
   end
end

return firstScript