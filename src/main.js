const { assert } = require('console')
const {app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')

let win = null

function createWindow(){
    win = new BrowserWindow({
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
    let popup = new BrowserWindow({
        width: 500,
        height: 500,
        frame: false,
        webPreferences:{
            nodeIntegration: true,
            enableRemoteModule: true
        }
    })
    popup.on('close', () => {
        popup = null
    })
    popup.loadFile('src/add-entry.html')
    popup.show()
})

ipcMain.on('entry-added', (event, entry) =>{
    win.webContents.send('addEntry', entry)
    let entry_data = []

    if (fs.existsSync("assets/data.csv")){
        entry_data = fs.readFileSync("assets/data.csv").toString()
    }
    else{
        //add header for new file
        entry_data.push("Date, Amount, Category")
    }

    new_entry = entry.join(', ')
    entry_data += '\n' + new_entry
    fs.writeFileSync('assets/data.csv', entry_data)
})