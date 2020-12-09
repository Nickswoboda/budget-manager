const { assert } = require('console')
const {app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')

let main_win = null
let entry_win = null
let category_win = null

function createMainWindow(){
    main_win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences:{
            nodeIntegration: true,
            enableRemoteModule: true
        }
    })

    main_win.loadFile('src/index.html')
    main_win.on('close', () => { app.quit()})
}

app.whenReady().then(createMainWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin'){
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0){
        createMainWindow()
    }
})

function createEntryWindow(is_expense, entry)
{
    entry_win = new BrowserWindow({
        width: 300,
        height: 500,
        frame: false,
        parent: main_win,
        modal: true,
        webPreferences:{
            nodeIntegration: true,
            enableRemoteModule: true
        }
    })
    entry_win.on('close', () => {
        entry_win = null
    })
    entry_win.loadFile('src/add-entry.html')
    entry_win.once('ready-to-show', () =>{
        entry_win.show()
        entry_win.webContents.send('initialize-popup', is_expense, entry)
    })

    //entry_win.webContents.openDevTools()
}

ipcMain.on('add-entry-clicked', (event, is_expense) => {
    createEntryWindow(is_expense, null)
})
ipcMain.on('edit-entry-clicked', (event, entry) => {
    createEntryWindow(entry.is_expense, entry)
})

ipcMain.on('entry-submitted', (event, data) =>
{
    if (data.index === -1){
        main_win.webContents.send('addEntry', data)
    }
    else{
        main_win.webContents.send('update-entries', data)
    }
})

ipcMain.on('delete-entry-requested', (event, entry_index ) =>{
    const options = {
        type: 'info',
        title: 'Confirmation',
        message: "Are you sure you want to delete the entry?",
        buttons: ['Yes', 'No']
    }
    dialog.showMessageBox(options).then(result => {
        if (result.response === 0){
            main_win.webContents.send('deleteEntry', entry_index)
            entry_win.close()
        }
    })

})