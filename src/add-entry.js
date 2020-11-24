const {ipcRenderer, remote} = require('electron')

function isValidInput()
{
    let date = document.getElementById('date-input').valueAsDate
    let year = date.getFullYear()
    if (year < 1000 || year > 3000) return false
    let month = date.getMonth()
    if (month < 0 || month > 12) return false
    let days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    let day = date.getDate()
    if (day < 1 || day > days_in_month[month]) return false

    let amount = document.getElementById('amount-input').valueAsNumber
    if (isNaN(amount) || amount === 0) return false

    return true
}
document.getElementById('date-input').valueAsDate = new Date()
var submit_btn = document.getElementById('submit-btn')
submit_btn.addEventListener('click', () =>{
    if (!isValidInput()) return

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
