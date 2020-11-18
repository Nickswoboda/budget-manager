const remote = require('electron').remote

var submit_btn = document.getElementById('submit-btn')
submit_btn.addEventListener('click', () =>{
    let win = remote.getCurrentWindow()
    win.close()
})

var cancel_btn = document.getElementById('cancel-btn')
cancel_btn.addEventListener('click', () =>{
    let win = remote.getCurrentWindow()
    win.close()
})