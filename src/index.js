const { ipcRenderer } = require('electron')
const fs = require('fs')

function updateCategoryTotal(category, total, percentage)
{
    let table = document.getElementById("totals-table")

    for (i = 0; i < table.rows.length; ++i){
        row_category = table.rows[i].cells[0].innerHTML
        if (row_category === category){
            table.rows[i].cells[1].innerHTML = total
            table.rows[i].cells[2].innerHTML = percentage
            return
        }
    }

    var new_row = table.insertRow(1)
    let category_cell = new_row.insertCell(0)
    let amount_cell = new_row.insertCell(1)
    let percent_cell = new_row.insertCell(2)

    category_cell.innerHTML = category 
    amount_cell.innerHTML = total 
    percent_cell.innerHTML = percentage

}
function updateTotalsTable()
{
    let categories = {} 
    let total = 0

    let table = document.getElementById("table")
    var rows = table.querySelectorAll("tr")

    for (var i = 1; i < rows.length; ++i){
        var row = []
        var cols = rows[i].querySelectorAll("td")

        for (var j = 1; j < cols.length; ++j){
            row.push(cols[j].innerHTML)
        }

        if (row[1] in categories){
            categories[row[1]] += parseFloat(row[0])
        }
        else{
            categories[row[1]] = parseFloat(row[0])
        }
        total += parseFloat(row[0])
    }

    for (item in categories){
        let amount = parseFloat(categories[item])
        let percentage = amount / total

        updateCategoryTotal(item, amount.toFixed(2), percentage.toFixed(2) * 100)
    }

}

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

    updateTotalsTable()
}

loadTableFromCSV()

function saveTableAsCSV()
{
    var csv = []

    let table = document.getElementById("table")
    var rows = table.querySelectorAll("tr")

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
    updateTotalsTable()
})


