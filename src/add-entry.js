const {ipcRenderer, remote} = require('electron')

document.getElementById('date-input').valueAsDate = new Date()
var submit_btn = document.getElementById('submit-btn')
submit_btn.addEventListener('click', () =>{
    var data = [
        document.getElementById('date-input').value.toString(),
        document.getElementById('amount-input').value.toString(),
        document.getElementById('category-input').value.toString()
    ]

    ipcRenderer.send('entry-added', data)
    let win = remote.getCurrentWindow()
    win.close()
})

var cancel_btn = document.getElementById('cancel-btn')
cancel_btn.addEventListener('click', () =>{
    let win = remote.getCurrentWindow()
    win.close()
})
