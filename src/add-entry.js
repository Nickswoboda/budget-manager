const {ipcRenderer, remote} = require('electron')

var submit_btn = document.getElementById('submit-btn')
submit_btn.addEventListener('click', () =>{
    var data = {
        date: document.getElementById('date-input').value,
        amount: document.getElementById('amount-input').value,
        category: document.getElementById('category-input').value
    }

    ipcRenderer.send('entry-added', data)
    let win = remote.getCurrentWindow()
    win.close()
})

var cancel_btn = document.getElementById('cancel-btn')
cancel_btn.addEventListener('click', () =>{
    let win = remote.getCurrentWindow()
    win.close()
})
