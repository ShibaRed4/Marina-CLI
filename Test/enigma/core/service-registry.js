// New file: service-registry.js - Central registry for all services
import { registerClass } from './interop.js';

// Global service registry
const serviceRegistry = new Map();

// Enigma class that will be the main access point in Lua
export class Enigma {
  constructor() {
    // Nothing needed in constructor
  }
  
  // Import a registered service by name
  import(serviceName) {
    if (!serviceRegistry.has(serviceName)) {
      throw new Error(`Service "${serviceName}" is not registered. Make sure to register it first using exportService().`);
    }
    return serviceRegistry.get(serviceName);
  }
}

// Register a service in the registry
export function exportService(serviceName, serviceInstance) {
  serviceRegistry.set(serviceName, serviceInstance);
  console.log(`Exported service: ${serviceName}`);
  return serviceInstance;
}

// Initialize the Enigma framework system
export function initEnigmaFramework() {
  // Create and register the Enigma instance
  const enigmaInstance = new Enigma();
  
  // Register the Enigma class in Lua as a global
  registerClass("enigma", enigmaInstance);
  
  return enigmaInstance;
}