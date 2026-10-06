const { app, BrowserWindow, dialog, ipcMain, net, protocol, shell } = require('electron')
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')

protocol.registerSchemesAsPrivileged([
  { scheme: 'botw', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
])

const TITLE_ID = '01007EF00011E000'
const SAVE_NAME = 'game_data.sav'
const VALID_SIZES = new Set([
  896976, 897160, 897112, 907824, 916576, 1020648,
  1027208, 1027216, 1027248
])
const VALID_HEADERS = new Set([
  0x24e2, 0x24ee, 0x2588, 0x29c0, 0x2a46, 0x2f8e,
  0x3ef8, 0x3ef9, 0x471a, 0x471b, 0x471e,
  0x0f423d, 0x0f423e, 0x0f423f, 0x4730
])
const FIELD_HASHES = {
  rupees: 0x23149bf8,
  hearts: 0x2906f327,
  stamina: 0x3adff047,
  playtime: 0x73c29681
}
const KEEP_BACKUPS = 20
const fsp = fs.promises

const allowedSaveFiles = new Set()
let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    frame: false,
    backgroundColor: '#171916',
    title: '旷野之息存档修改器',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.removeMenu()
  mainWindow.loadFile(path.join(__dirname, 'zelda-botw', 'index.html'))
  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-prevent-unload', (event) => {
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'warning',
      buttons: ['仍然关闭', '继续编辑'],
      defaultId: 1,
      cancelId: 1,
      title: '未保存的修改',
      message: '当前存档有未保存的修改。',
      detail: '关闭窗口会丢失这些修改。'
    })
    if (choice === 0) event.preventDefault()
  })
}

function normalizeFilePath (filePath) {
  return path.resolve(String(filePath || ''))
}

function assertSaveBuffer (buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 16) {
    throw new Error('存档数据为空或不完整')
  }
  const header = buffer.readUInt32LE(0)
  if (!VALID_SIZES.has(buffer.length) || !VALID_HEADERS.has(header)) {
    throw new Error(`不支持的存档格式（大小 ${buffer.length}，标头 0x${header.toString(16)}）`)
  }
}

function readSummary (buffer) {
  const pending = new Map(Object.entries(FIELD_HASHES).map(([name, hash]) => [hash, name]))
  const offsets = {}
  for (let offset = 0x0c; offset <= buffer.length - 8 && pending.size; offset += 8) {
    const hash = buffer.readUInt32LE(offset)
    const name = pending.get(hash)
    if (!name) continue
    offsets[name] = offset + 4
    pending.delete(hash)
  }
  return {
    versionHeader: `0x${buffer.readUInt32LE(0).toString(16).toUpperCase()}`,
    rupees: offsets.rupees === undefined ? null : buffer.readUInt32LE(offsets.rupees),
    hearts: offsets.hearts === undefined ? null : buffer.readUInt32LE(offsets.hearts) / 4,
    stamina: offsets.stamina === undefined ? null : buffer.readFloatLE(offsets.stamina),
    playtime: offsets.playtime === undefined ? null : buffer.readUInt32LE(offsets.playtime)
  }
}

async function pathExists (filePath) {
  try {
    await fsp.access(filePath)
    return true
  } catch {
    return false
  }
}

async function safeReadDirectories (directory) {
  try {
    const entries = await fsp.readdir(directory, { withFileTypes: true })
    return entries.filter(entry => entry.isDirectory())
  } catch {
    return []
  }
}

async function findTitleDirectories (rootDirectory) {
  const root = normalizeFilePath(rootDirectory)
  const found = new Set()
  const directCandidates = [
    root,
    path.join(root, TITLE_ID),
    path.join(root, 'user', 'nand', 'user', 'save'),
    path.join(root, 'nand', 'user', 'save'),
    path.join(root, 'save')
  ]

  for (const candidate of directCandidates) {
    if (path.basename(candidate).toUpperCase() === TITLE_ID && await pathExists(candidate)) {
      found.add(candidate)
      continue
    }
    for (const owner of await safeReadDirectories(candidate)) {
      const ownerPath = path.join(candidate, owner.name)
      const directTitle = path.join(ownerPath, TITLE_ID)
      if (await pathExists(directTitle)) found.add(directTitle)
      for (const profile of await safeReadDirectories(ownerPath)) {
        const titlePath = path.join(ownerPath, profile.name, TITLE_ID)
        if (await pathExists(titlePath)) found.add(titlePath)
      }
    }
  }
  return [...found]
}

function settingsPath () {
  return path.join(app.getPath('userData'), 'settings.json')
}

function readSettings () {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath(), 'utf8'))
    if (!Array.isArray(settings.recentRoots)) settings.recentRoots = []
    if (settings.saveRoot && !settings.recentRoots.some(item => item.path === settings.saveRoot)) {
      settings.recentRoots.unshift({ path: settings.saveRoot, lastUsedAt: new Date(0).toISOString() })
    }
    return settings
  } catch {
    return { recentRoots: [] }
  }
}

function writeSettings (settings) {
  const filePath = settingsPath()
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf8')
}

async function recentRoots () {
  const items = readSettings().recentRoots
    .filter(item => item && typeof item.path === 'string' && item.path.trim())
  const listed = []
  for (const item of items) {
    const itemPath = normalizeFilePath(item.path)
    listed.push({
      path: itemPath,
      name: path.basename(itemPath) || itemPath,
      lastUsedAt: item.lastUsedAt,
      available: await pathExists(itemPath)
    })
  }
  return listed
}

async function getRememberedRoots () {
  if (process.env.BOTW_SAVE_ROOT) return [path.resolve(process.env.BOTW_SAVE_ROOT)]
  const roots = new Set([
    path.resolve(__dirname, '..', 'Eden-Windows-v0.2.1'),
    path.resolve(__dirname, '..')
  ])
  for (const item of await recentRoots()) roots.add(item.path)
  return [...roots]
}

function rememberRoot (saveRoot) {
  const normalized = normalizeFilePath(saveRoot)
  const settings = readSettings()
  settings.recentRoots = settings.recentRoots
    .filter(item => item && typeof item.path === 'string' && normalizeFilePath(item.path).toLowerCase() !== normalized.toLowerCase())
  settings.recentRoots.unshift({ path: normalized, lastUsedAt: new Date().toISOString() })
  settings.recentRoots = settings.recentRoots.slice(0, 8)
  delete settings.saveRoot
  writeSettings(settings)
  return recentRoots()
}

function forgetRoot (saveRoot) {
  const normalized = normalizeFilePath(saveRoot)
  const settings = readSettings()
  settings.recentRoots = settings.recentRoots
    .filter(item => item && typeof item.path === 'string' && normalizeFilePath(item.path).toLowerCase() !== normalized.toLowerCase())
  delete settings.saveRoot
  writeSettings(settings)
  return recentRoots()
}

function captionUrl (filePath) {
  return 'botw://slot/?save=' + encodeURIComponent(filePath)
}

async function slotFromFile (filePath) {
  const buffer = await fsp.readFile(filePath)
  assertSaveBuffer(buffer)
  const normalized = normalizeFilePath(filePath)
  const captionPath = path.join(path.dirname(normalized), 'caption.jpg')
  const stat = await fsp.stat(normalized)
  allowedSaveFiles.add(normalized)
  return {
    slot: path.basename(path.dirname(normalized)),
    filePath: normalized,
    modifiedAt: stat.mtime.toISOString(),
    size: stat.size,
    caption: await pathExists(captionPath) ? captionUrl(normalized) : null,
    summary: readSummary(buffer)
  }
}

async function discoverSlots (rootDirectory) {
  const roots = rootDirectory ? [rootDirectory] : await getRememberedRoots()
  const slots = []
  const seen = new Set()
  for (const root of roots) {
    for (const titleDirectory of await findTitleDirectories(root)) {
      for (let slot = 0; slot <= 5; slot++) {
        const filePath = path.join(titleDirectory, String(slot), SAVE_NAME)
        if (seen.has(filePath) || !await pathExists(filePath)) continue
        seen.add(filePath)
        try { slots.push(await slotFromFile(filePath)) } catch {}
      }
    }
  }
  return slots.sort((a, b) => {
    const modifiedDifference = Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt)
    return modifiedDifference || Number(a.slot) - Number(b.slot)
  })
}

function assertAllowedPath (filePath) {
  const normalized = normalizeFilePath(filePath)
  if (!allowedSaveFiles.has(normalized)) throw new Error('该文件尚未由修改器打开，拒绝写入')
  if (path.basename(normalized).toLowerCase() !== SAVE_NAME) throw new Error('只能写入 game_data.sav')
  return normalized
}

function timestamp () {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
}

function backupDirectoryFor (filePath) {
  return path.join(path.dirname(path.dirname(filePath)), '.botw-save-editor-backups', `slot-${path.basename(path.dirname(filePath))}`)
}

async function pruneBackups (backupDirectory) {
  const entries = await fsp.readdir(backupDirectory, { withFileTypes: true })
  const backups = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(`-${SAVE_NAME}`)) continue
    const backupPath = path.join(backupDirectory, entry.name)
    const stat = await fsp.stat(backupPath)
    backups.push({ backupPath, createdAt: stat.mtimeMs })
  }
  backups.sort((a, b) => b.createdAt - a.createdAt)
  await Promise.all(backups.slice(KEEP_BACKUPS).map(item => fsp.rm(item.backupPath)))
}

async function writeSaveSafely (filePath, data) {
  const target = assertAllowedPath(filePath)
  const nextBuffer = Buffer.from(data)
  assertSaveBuffer(nextBuffer)
  const currentBuffer = await fsp.readFile(target)
  assertSaveBuffer(currentBuffer)

  const backupDirectory = backupDirectoryFor(target)
  await fsp.mkdir(backupDirectory, { recursive: true })
  const backupPath = path.join(backupDirectory, `${timestamp()}-${SAVE_NAME}`)
  await fsp.copyFile(target, backupPath, fs.constants.COPYFILE_EXCL)

  const temporaryPath = `${target}.${process.pid}.tmp`
  const rollbackPath = `${target}.${process.pid}.rollback`
  try {
    await fsp.writeFile(temporaryPath, nextBuffer, { flag: 'wx' })
    await fsp.rename(target, rollbackPath)
    try {
      await fsp.rename(temporaryPath, target)
      await fsp.rm(rollbackPath)
    } catch (error) {
      if (await pathExists(rollbackPath) && !await pathExists(target)) await fsp.rename(rollbackPath, target)
      throw error
    }
  } finally {
    if (await pathExists(temporaryPath)) await fsp.rm(temporaryPath)
  }
  await pruneBackups(backupDirectory)

  const stat = await fsp.stat(target)
  return { backupPath, summary: readSummary(nextBuffer), modifiedAt: stat.mtime.toISOString() }
}

async function listBackups (filePath) {
  const target = assertAllowedPath(filePath)
  const backupDirectory = backupDirectoryFor(target)
  if (!await pathExists(backupDirectory)) return []
  const entries = await fsp.readdir(backupDirectory, { withFileTypes: true })
  const backups = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(`-${SAVE_NAME}`)) continue
    const backupPath = path.join(backupDirectory, entry.name)
    const stat = await fsp.stat(backupPath)
    backups.push({
      name: entry.name,
      backupPath,
      createdAt: stat.mtime.toISOString()
    })
  }
  return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

async function restoreBackup (filePath, backupPath) {
  const target = assertAllowedPath(filePath)
  const backupDirectory = path.resolve(backupDirectoryFor(target))
  const source = path.resolve(String(backupPath || ''))
  const relative = path.relative(backupDirectory, source)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('备份文件不属于当前存档槽位')
  }
  const buffer = await fsp.readFile(source)
  assertSaveBuffer(buffer)
  return writeSaveSafely(target, buffer)
}

ipcMain.handle('save:discover', (_event, rootDirectory) => discoverSlots(rootDirectory))
ipcMain.handle('save:recent-roots', () => recentRoots())
ipcMain.handle('save:use-root', async (_event, rootDirectory) => {
  const slots = await discoverSlots(rootDirectory)
  return { root: normalizeFilePath(rootDirectory), slots, recentRoots: await rememberRoot(rootDirectory) }
})
ipcMain.handle('save:forget-root', (_event, rootDirectory) => forgetRoot(rootDirectory))
ipcMain.handle('save:choose-root', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'], title: '选择 Eden 目录或存档目录' })
  if (result.canceled) return null
  const root = result.filePaths[0]
  return { root, slots: await discoverSlots(root), recentRoots: await rememberRoot(root) }
})
ipcMain.handle('save:choose-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: '选择 game_data.sav',
    filters: [{ name: 'BOTW Save', extensions: ['sav'] }]
  })
  if (result.canceled) return null
  const slot = await slotFromFile(result.filePaths[0])
  await rememberRoot(path.dirname(path.dirname(result.filePaths[0])))
  return slot
})
ipcMain.handle('save:read', (_event, filePath) => {
  const target = assertAllowedPath(filePath)
  return fsp.readFile(target)
})
ipcMain.handle('save:write', (_event, payload) => writeSaveSafely(payload.filePath, payload.data))
ipcMain.handle('save:list-backups', (_event, filePath) => listBackups(filePath))
ipcMain.handle('save:restore-backup', (_event, payload) => restoreBackup(payload.filePath, payload.backupPath))
ipcMain.handle('save:show-in-folder', (_event, filePath) => shell.showItemInFolder(assertAllowedPath(filePath)))

ipcMain.on('window:minimize', () => mainWindow && mainWindow.minimize())
ipcMain.on('window:toggle-maximize', () => {
  if (!mainWindow) return
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
})
ipcMain.on('window:close', () => mainWindow && mainWindow.close())

app.whenReady().then(() => {
  protocol.handle('botw', async (request) => {
    try {
      const savePath = new URL(request.url).searchParams.get('save')
      const normalized = assertAllowedPath(savePath)
      const captionPath = path.join(path.dirname(normalized), 'caption.jpg')
      return await net.fetch(pathToFileURL(captionPath).href)
    } catch {
      return new Response(null, { status: 404 })
    }
  })
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
