-- Welcome to Marina! 
-- The web game framework that uses Lua!

-- Most game scripts for Marina have two very important functions: init() and onUpdate()
-- init() runs as soon as it's initialized, obviously.
-- onUpdate() runs every frame AFTER everything has rendered.


local firstScript = {}

firstScript.init = function()
    print("Running once!")
end

firstScript.onUpdate = function(deltaTime)
    print("Running every frame!")
end

return firstScript