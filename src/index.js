const { ipcRenderer } = require('electron')

var add_btn = document.getElementById("add-btn")
add_btn.addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked')
})

ipcRenderer.on('addEntry', (event, args) => {
    console.log("index.js")
    let table = document.getElementById('table')
    let row = table.insertRow(1)
    let date = row.insertCell(0)
    let amount = row.insertCell(1)
    let category = row.insertCell(2)

    date.innerHTML = args.date
    amount.innerHTML = args.amount
    category.innerHTML = args.category
})


