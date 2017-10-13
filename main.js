const electron = require('electron')
const path = require('path')
const https = require('https')
const fs = require('fs')
const os = require('os')
const fsExtra = require('fs-extra')
const exec = require('child_process').execFile
const execSync = require('child_process').execSync
const spawn = require('child_process').spawn
const util = require('util')

const session = electron.session;
const app = electron.app
const BrowserWindow = electron.BrowserWindow

const localAppVersion = require('./package.json').version ? require('./package.json').version : app.getVersion()

const PATH_APP_NODE_MODULES = path.join(__dirname, '..', '..', 'app', 'node_modules')
require('module').globalPaths.push(PATH_APP_NODE_MODULES)

console.log('OS arch:', os.arch())
console.log('OS platform:', os.platform())

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let remoteVersion


function createWindow() {

  ///////////// CHECK UPDATES
  if (os.platform() === 'win32') {
    https.get('https://raw.githubusercontent.com/samCrock/cereal/master/package.json', (res) => {
      var body = ''
      res.on('data', (d) => {
        body += d
      });
      res.on('end', () => {
        var packageContent = JSON.parse(body);
        console.log('Remote version ->  ' + packageContent.version);
        if (packageContent.version !== localAppVersion) {
          console.log('\nUpdate available');
          global.config = {
            update: true,
            remoteVersion: packageContent.version
          };
          remoteVersion = packageContent.version
        }
      });
    }).on('error', (e) => {
      console.error(e);
    });
  }
  ///////////////

  console.log('Local version  -> ', localAppVersion);
  // Create the browser window.
  mainWindow = new BrowserWindow({
    show: false,
    frame: true,
    backgroundColor: '#2e2c29',
    autoHideMenuBar: true
  })

  updateWindow = new BrowserWindow({
    show: false,
    frame: true,
    backgroundColor: '#2e2c29',
    autoHideMenuBar: true
  })

  mainWindow.maximize()

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  mainWindow.setTitle(require('./package.json').name + ' ' + localAppVersion)
    // mainWindow.titleBarStyle = 'hidden'
    // mainWindow.webContents.openDevTools()
  mainWindow.on('close', function(e) {
    app.quit();
  })
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function(e) {

  // e.preventDefault()
  // process.stdout.write('\nQuitting..');
  fsExtra.readFile('update.zip', (err) => {
    if (!err) {
      // createWindow()
      // } else {
      process.noAsar = true
        // mainWindow.destroy() // ncessary to bypass the repeat-quit-check in the render process.
      process.stdout.write('\nExtracting update..')
      fsExtra.removeSync('cereal-w-release')
      execSync(`powershell.exe -nologo -noprofile -command "& { Add-Type -A 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::ExtractToDirectory('update.zip', '.'); }"`, function(err, data) {
        process.stdout.write(err)
        process.stdout.write(data)
      })
      fsExtra.unlinkSync('update.zip')
      process.stdout.write('Done!')
      process.stdout.write('\nUpdating..\n')
      let files = fsExtra.readdirSync('cereal-w-release')
      let update_file = files[1]
      let remoteV = update_file.split('Cereal Setup ')[1]
      remoteV = remoteV.split('.exe')[0]
      let updatePath = './cereal-w-release/' + update_file
      process.stdout.write('\n', updatePath)

      // let child = spawn(updatePath)
      let packageFile = require('./package.json');

      packageFile.version = remoteV;

      console.log('Updated to', packageFile.version)

      fs.writeFile('./package.json', JSON.stringify(packageFile), null, 2, function(err) {
        if (err) return console.log(err);
        console.log(JSON.stringify(packageFile));
        console.log('writing to ' + './package.json');
      });

      app.quit()
      let child = spawn(updatePath, {
        detached: true,
        stdio: ['ignore']
      })
      child.unref()

    } else {
      createWindow()
    }

  })
})

// Quit when all windows are closed.
app.on('window-all-closed', function() {
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