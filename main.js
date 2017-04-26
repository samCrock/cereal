const electron = require('electron')
const path = require('path')
const https = require('https')

const fs = require('fs')

const localAppVersion = require('./package.json').version
// Module to control application life.
const app = electron.app
    // Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const os = require('os')
const fsExtra = require('fs-extra')

// const log = require('electron-log');
const {autoUpdater} = require('electron-updater')

const PATH_APP_NODE_MODULES = path.join(__dirname, '..', '..', 'app', 'node_modules')
require('module').globalPaths.push(PATH_APP_NODE_MODULES)

console.log('Current OS arch:', os.arch())
console.log('Current OS platform:', os.platform())

let updateFileName = ''
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {

    /////////////
    https.get('https://raw.githubusercontent.com/samCrock/cereal/master/package.json', (res) => {
        var body = ''
        res.on('data', (d) => {
            body += d
        });
        res.on('end', () => {
            var packageContent = JSON.parse(body);
            process.stdout.write('Remote version ->  ' + packageContent.version);
            updateFileName = 'Cereal-' + packageContent.version + '.deb'
            if (packageContent.version !== localAppVersion) {
                process.stdout.write('\nNeed an update pal?');
                global.config = {
                    update: true,
                    remoteVersion: packageContent.version
                };
            }
        });
    }).on('error', (e) => {
        console.error(e);
    });
    ///////////////

    console.log('Local version  -> ', localAppVersion);
    // Create the browser window.
    mainWindow = new BrowserWindow({
        show: false,
        frame: false,
        backgroundColor: '#2e2c29'
    })

    mainWindow.maximize()

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`)

    mainWindow.setTitle(require('./package.json').name)
    mainWindow.titleBarStyle = 'hidden'

    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
    // autoUpdater.checkForUpdates()
    createWindow()
})

// autoUpdater.on('update-downloaded', (ev, info) => {
//     // Wait 5 seconds, then quit and install
//     // In your application, you don't need to wait 5 seconds.
//     // You could call autoUpdater.quitAndInstall(); immediately
//     console.log('update-downloaded')
//     setTimeout(function() {
//         autoUpdater.quitAndInstall();
//     }, 5000)
// })

// autoUpdater.on('checking-for-update', (ev, info) => {
//     console.log('checking-for-update', info)
// })

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    process.stdout.write('\nQuitting..');
    let fileName = updateFileName
    fs.readFile(fileName, (err) => {
        if (err) {
            process.stdout.write('No updates available');
        } else {
            process.stdout.write('\nUpdating...');
            let util = require('util');
            let exec = require('child_process').exec;
            let platform = os.platform()
            switch (process.platform) {
                case 'darwin':
                    return exec('open "' + fileName + '"')
                case 'win32':
                    return shell.openExternal('"' + fileName + '"')
                case 'win64':
                    return shell.openExternal('"' + fileName + '"')
                default:
                    return exec('sudo dpkg -i ./Cereal-0.1.1.deb')
            }

        }
    });
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})
