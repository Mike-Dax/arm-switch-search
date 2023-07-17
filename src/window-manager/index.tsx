// Modules to control application life and create native browser window
// @ts-ignore
import { app, BrowserWindow, contentTracing, screen } from 'electron'
import path from 'path'
import { rename, readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { cwd } from 'node:process'
import { randomBytes } from 'crypto'

let mainWindow: BrowserWindow = null!

// Apply chromium switches
const switchJSON = process.env.SET_SWITCHES
const runId = process.env.RUN_ID
const url = process.env.ALTERNATE_URL

if (!switchJSON || !runId) {
  console.error(`!switchJSON || !runId`)
  process.exit(1)
}

const switches: string[][] = JSON.parse(switchJSON)

for (const s of switches) {
  app.commandLine.appendSwitch(s[0], s[1])
  console.log(`appendSwitch`, s)
}

function createWindow() {
  // Create the browser window.
   mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  })

  // load the webgl lines fat test
  mainWindow.loadURL(url ?? 'https://threejs.org/examples/webgl_lines_fat.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // make the dir
  const dir = `electron-test-${runId}-${randomBytes(16).toString('hex')}`
  const base = path.join(cwd(), `runs`, dir)

  console.log(`saving to ${base}`)

  await mkdir(base, { recursive: true });

  // Begin a content trace
  await contentTracing.startRecording({
    // categoryFilter: 'disabled-by-default-v8.cpu_profiler',
    included_categories: [
      '*', // everything
      'disabled-by-default-v8.cpu_profiler', // but also this
      'disabled-by-default-v8.cpu_profiler.hires',
    ],
    traceOptions: 'record-until-full',
  });

  // capture 5 seconds of trace
  await new Promise((resolve, reject) => setTimeout(resolve, 5_000))

  const tracePath = await contentTracing.stopRecording();
  
  // Rename/move the file in one go
  // await rename(tracePath, path.join(base, `trace.json`))

  // Copy the file manually, as renaming across volume bounds (/tmp to local run folder)
  // isn't legal on Linux. Read -> Write -> Erase old
  const traceFile = await readFile(tracePath)
  await writeFile(path.join(base, `trace.json`), traceFile )
  await unlink(tracePath)

  // take a screenshot too
  const screenshot = await mainWindow.webContents.capturePage()
  await writeFile(path.join(base, `screenshot.png`), screenshot.toPNG())

  // measure the average of the past 10 fps,
  // my god what a hack

  const averageFPS10Frames = "new Promise((resolve, reject) => {const start = performance.now();setTimeout(reject, 1000);requestAnimationFrame(() => {requestAnimationFrame(() => {requestAnimationFrame(() => {requestAnimationFrame(() => {requestAnimationFrame(() => {requestAnimationFrame(() => {requestAnimationFrame(() => {requestAnimationFrame(() => {requestAnimationFrame(() => {requestAnimationFrame(() => {const end = performance.now(); const delta10 = end-start;const delta = delta10 / 10;resolve(delta);console.log(delta, `ms between frames`, 1000 / delta, `fps`);})})})})})})})})})})})"

  const fps = await mainWindow.webContents.executeJavaScript(averageFPS10Frames)
  .then((delta) => {
    const fpsVal = 1000 / delta
    console.log(delta, `ms between frames`, fpsVal, `fps`)
    return fpsVal
  }).catch(err => 0)

  await writeFile(path.join(base, `settings.json`), JSON.stringify({
    runId: runId,
    switches: switches,
    displays: screen.getAllDisplays().map(disp => ({
      label: disp.label,
      width: disp.size.width,
      height: disp.size.height,
      scaleFactor: disp.scaleFactor,
      displayFrequency: disp.displayFrequency,
      closest: screen.getDisplayNearestPoint({x: 0, y: 0}).id === disp.id
    })),
    fps: fps
  }))

  app.exit()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
