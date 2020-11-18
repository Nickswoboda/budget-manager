const {app, BrowserWindow, ipcMain } = require('electron')

function createWindow(){
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences:{
            nodeIntegration: true,
            enableRemoteModule: true
        }
    })

    win.loadFile('src/index.html')
    win.on('close', () => { app.quit()})
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin'){
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0){
        createWindow()
    }
})

ipcMain.on('add-entry-clicked', () => {
    let win = new BrowserWindow({
        width: 500,
        height: 500,
        frame: false,
        webPreferences:{
            nodeIntegration: true,
            enableRemoteModule: true
        }
    })
    win.on('close', () => {
        win = null
    })
    win.loadFile('src/add-entry.html')
    win.show()
    win.webContents.openDevTools()

})