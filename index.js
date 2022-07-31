const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const slash = require('slash');
const os = require('os');
const path = require('path');

process.env.NODE_ENV = 'development';

const isDev = process.env.NODE_ENV !== 'production'
const isMac = process.platform === 'darwin'

let mainWindow;
let aboutWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'ImageShrink',
        width: isDev ? 800 : 500,
        height: 600,
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
        resizable: isDev,
        backgroundColor: 'white',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    if (isDev) {
        mainWindow.webContents.openDevTools()
    }

    mainWindow.loadFile(`./app/index.html`)
}

function createAboutWindow() {
    aboutWindow = new BrowserWindow({
        title: 'ImageShrink',
        width: 300,
        height: 300,
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
        resizable: isDev,
        backgroundColor: 'white'
    })

    aboutWindow.loadFile(`./app/about.html`)
}

app.on('ready', () => {
    createMainWindow()

    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)

    // globalShortcut.register('CmdOrCtrl+R', () => mainWindow.reload())
    // globalShortcut.register(isMac ? 'Command+Alt+I' : 'Ctrl+Alt+I', () => mainWindow.toggleDevTools())

    mainWindow.on('closed', () => {
        mainWindow = null
    })
})

const menu = [
    ...(isMac ? [{
        label: app.name,
        submenu: [
            { label: 'About', click: createAboutWindow },
        ]
    }] : []),
    { role: 'fileMenu' },
    ...(!isMac ? [{
        label: 'Help',
        submenu: [
            { label: 'About', click: createAboutWindow },
        ]
    }] : []),
    ...(isDev ? [{
        label: 'Developer',
        submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { role: 'separator' },
            { role: 'toggleDevTools' }
        ]
    }] : [])
]

// if (isMac) {
//   menu.unshift({ role: 'appMenu' })
// }

ipcMain.on('image:minimize', (e, options) => {
    options.dest = path.join(os.homedir(), 'imageshrink')
    shrinkImage(options);
})

async function shrinkImage({ imgPath, quality, dest }) {

    try {
        const pngQuality = quality / 100;
        const files = await imagemin([slash(imgPath)], {
            destination: dest,
            plugins: [
                imageminMozjpeg({ quality }),
                imageminPngquant({
                    quality: [pngQuality, pngQuality]
                })
            ]
        })

        shell.openPath(dest)

        console.log(files)

        mainWindow.webContents.send('image:done');
    } catch (err) {
        console.error(err)
    }
}

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit()
    }
})