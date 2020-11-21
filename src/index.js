const { ipcRenderer } = require('electron')
const fs = require('fs')


function loadTableFromCSV()
{
    if (!fs.existsSync("assets/data.csv")){
        return
    }

    let data = fs.readFileSync("assets/data.csv").toString()

    var header = "Date,Amount,Category\n"
    var index = data.indexOf(header)
    if (index != 0){
        console.log("CSV file not formatted correctly")
        return
    }

    data = data.substr(header.length)

    let entries = data.split("\n")
    let table = document.getElementById('table')
    entries.forEach((value) => {
        let row = table.insertRow(1)
        let values = value.split(",")
        for (let i = 0; i < 3; ++i){
            let cell = row.insertCell(i)
            cell.innerHTML = values[i]
        }
    })
}

loadTableFromCSV()

function saveTableAsCSV()
{
    var csv = []
    var rows = document.querySelectorAll("table tr")

    for (var i = 0; i < rows.length; ++i){
        var row = []
        var cols = rows[i].querySelectorAll("td, th")

        for (var j = 0; j < cols.length; ++j){
            row.push(cols[j].innerHTML)
        }

        csv.push(row.join(","))
    }

    csv = csv.join("\n")
    fs.writeFileSync("assets/data.csv", csv)
}

var add_btn = document.getElementById("add-btn")
add_btn.addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked')
})

ipcRenderer.on('addEntry', (event, args) => {
    let table = document.getElementById('table')
    let row = table.insertRow(1)
    let date = row.insertCell(0)
    let amount = row.insertCell(1)
    let category = row.insertCell(2)

    date.innerHTML = args[0]
    amount.innerHTML = args[1]
    category.innerHTML = args[2]

    saveTableAsCSV()
})


