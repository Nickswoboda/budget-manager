const { ipcRenderer } = require('electron')

var add_btn = document.getElementById("add-btn")

add_btn.addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked')
})


