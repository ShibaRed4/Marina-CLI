import { defineConfig } from 'vite'
import process from "node:process"

export default defineConfig({
  // ...
  root: process.cwd(),
  server: {
    port:3000,
    watch: {
        usePolling: true,
        interval: 100
    },
    allowedHosts: [] // Edit to fit your needs (allow this to work on something like gitpod.)
  }
})