const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
const http = require("http")

let mainWindow
let serverProcess

const isDev = !app.isPackaged
const PORT = 3456

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "BI OS — Business Intelligence Platform",
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: "#0f0f13",
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL(`http://localhost:3000`)
    mainWindow.webContents.openDevTools({ mode: "bottom" })
  } else {
    startServer()
  }

  mainWindow.once("ready-to-show", () => mainWindow.show())
  mainWindow.on("closed", () => { mainWindow = null })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) { shell.openExternal(url); return { action: "deny" } }
    return { action: "allow" }
  })
}

function startServer() {
  const resourcesPath = process.resourcesPath || path.join(__dirname, "..")
  const serverDir = path.join(resourcesPath, "server", "apps", "web")
  serverProcess = spawn(process.execPath, ["server.js"], {
    cwd: serverDir,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      PORT: String(PORT),
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-key-for-demo-mode",
    },
  })

  serverProcess.stdout.on("data", (d) => console.log(`[server] ${d}`))
  serverProcess.stderr.on("data", (d) => console.error(`[server] ${d}`))
  serverProcess.on("exit", (code) => {
    if (code !== 0) console.error(`[server] exited code ${code}`)
  })

  waitForServer(() => {
    mainWindow.loadURL(`http://localhost:${PORT}`)
  })
}

function waitForServer(callback, retries = 60) {
  const check = () => {
    const req = http.get(`http://localhost:${PORT}`, (res) => {
      res.resume()
      callback()
    })
    req.on("error", () => {
      if (retries > 0) setTimeout(() => waitForServer(callback, retries - 1), 1000)
      else mainWindow.loadURL(`data:text/html,<h1>Error</h1><p>El servidor no respondió. Reintenta abrir la aplicación.</p>`)
    })
    req.setTimeout(3000, () => { req.destroy() })
  }
  check()
}

// ─── IPC Handlers ────────────────────────────────────────────

ipcMain.handle("get-app-version", () => app.getVersion())
ipcMain.handle("get-platform", () => process.platform)
ipcMain.handle("get-paths", () => ({
  userData: app.getPath("userData"),
  documents: app.getPath("documents"),
  downloads: app.getPath("downloads"),
  desktop: app.getPath("desktop"),
}))

ipcMain.handle("select-file", async (_, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: filters || [{ name: "Documents", extensions: ["pdf", "xlsx", "xls", "docx", "doc", "jpg", "png"] }],
  })
  return result.canceled ? [] : result.filePaths
})

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ["openDirectory"] })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle("show-save-dialog", async (_, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options)
  return result.canceled ? null : result.filePath
})

// ─── App Lifecycle ───────────────────────────────────────────

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill()
  if (process.platform !== "darwin") app.quit()
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
