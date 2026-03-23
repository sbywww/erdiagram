import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // IPC methods will be added here as needed
})
