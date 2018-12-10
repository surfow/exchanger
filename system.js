// Modules to control application life and create native browser window
const { ipcMain, app, dialog, remote, BrowserWindow, session } = require('electron')
const path = require('path')
const url = require('url');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let startWindow
var openedurl = "";
var surfow_protocol = 't-exchange';

const devMode = (process.argv || []).indexOf('--dev') !== -1

if (devMode) {
  const PATH_APP_NODE_MODULES = path.join(__dirname, '..', '..', 'app', 'node_modules')
  require('module').globalPaths.push(PATH_APP_NODE_MODULES)
}

ipcMain.removeAllListeners("ELECTRON_BROWSER_WINDOW_ALERT")
ipcMain.on("ELECTRON_BROWSER_WINDOW_ALERT", (event, message, title)=>{
  event.returnValue = 0
})
ipcMain.removeAllListeners("ELECTRON_BROWSER_WINDOW_CONFIRM")
ipcMain.on("ELECTRON_BROWSER_WINDOW_CONFIRM", (event, message, title)=>{
  event.returnValue = 1
})
ipcMain.removeAllListeners("ELECTRON_BROWSER_WINDOW_PROMPT")
ipcMain.on("ELECTRON_BROWSER_WINDOW_PROMPT", (event, message, title)=>{
  event.returnValue = 1
})

dialog.showErrorBox = function(title, content) {
    console.log(`${title}\n${content}`);
};

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
});

function createStart() {
  // Create the browser window.
 startWindow = new BrowserWindow({
      width: 500,
      height: 260,
      titleBarStyle: 'hidden',
      acceptFirstMouse: true,
      transparent: true,
      frame: false,
      show: false,
	  webPreferences: {
		preload: path.join(__dirname, 'bin/data5.html')
	  }
  })

  startWindow.loadFile('bin/data1.html');

  startWindow.setResizable(false);
  startWindow.setMaximizable(false);

  if (process.platform == 'win32') {
    openedurl = process.argv.slice(1)
  }


  startWindow.once('ready-to-show', () => {
      send_opened_url(openedurl);
      startWindow.show();
      startWindow.focus();
      /* REMOVE THIS */
	  //startWindow.toggleDevTools();
  })

  // Emitted when the window is closed.
  startWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    startWindow = null
  })

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function(){
    createStart();
    session.defaultSession.on('will-download', (event, item, webContents) => {
        event.preventDefault()
    });
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (startWindow === null) {
    createStart()
  }
})

app.setAsDefaultProtocolClient(surfow_protocol)

// Protocol handler for osx
app.on('open-url', function (event, url) {
  event.preventDefault()
  send_opened_url(url);
})

function send_opened_url(openedurl)
{
    if(openedurl != "")
    {
        startWindow.webContents.send('opened-url', openedurl.toString().replace(surfow_protocol+"://", "").replace("/", ""));
    }
}
