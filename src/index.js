const { ipcRenderer, remote } = require('electron')
const fs = require('fs')
const { parse } = require('path')

var expense_total = 0
var income_total = 0

function updateTotalPercentages(is_expense)
{
    let table = is_expense ? document.getElementById("expense-table") : document.getElementById("income-table")

    for (i = 1; i < table.rows.length; ++i){
        let amount = parseFloat(table.rows[i].cells[1].innerHTML)
        let total = is_expense ? expense_total : income_total
        let percentage = amount / total * 100
        table.rows[i].cells[2].innerHTML = percentage
    }

    let net_income = income_total + expense_total
    
    let net_income_text = document.getElementById("net-income")
    net_income_text.innerHTML = net_income

    net_income_text.style.color = net_income < 0 ? "red" : "green" 


}
function updateCategoryTotal(category, amount, is_expense)
{
    let table = is_expense ? document.getElementById("expense-table") : document.getElementById("income-table")

    if (is_expense){
        expense_total += parseFloat(amount)
    }else{
        income_total += parseFloat(amount)
    }
    for (i = 0; i < table.rows.length; ++i){
        row_category = table.rows[i].cells[0].innerHTML
        if (row_category === category){
            let amount_cell = table.rows[i].cells[1]
            let new_amount = parseFloat(amount_cell.innerHTML) + parseFloat(amount)
            amount_cell.innerHTML = new_amount
            updateTotalPercentages(is_expense)
            return
        }
    }

    var new_row = table.insertRow(1)
    let category_cell = new_row.insertCell(0)
    let amount_cell = new_row.insertCell(1)

    category_cell.innerHTML = category 
    amount_cell.innerHTML = amount 

    new_row.insertCell(2)
    updateTotalPercentages(is_expense)
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
    let table = document.getElementById('history-table')

    entries.forEach((value) => {
        let row = table.insertRow(1)
        let values = value.split(",")

        let amount = parseFloat(values[1])
        updateCategoryTotal(values[2], amount.toFixed(2), amount < 0)
        row.style.backgroundColor = amount < 0 ? "red" : "green"

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

    let table = document.getElementById("history-table")
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

var expense_button = document.getElementById("expense-btn")
expense_button.addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked', true)
})

var income_button = document.getElementById("income-btn")
income_button.addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked', false)
})

ipcRenderer.on('addEntry', (event, args) => {
    let table = document.getElementById('history-table')
    
    let row = table.insertRow(1)
    row.style.backgroundColor = parseFloat(args[1]) < 0 ? "red" : "green"

    let date = row.insertCell(0)
    let amount = row.insertCell(1)
    let category = row.insertCell(2)

    date.innerHTML = args[0]
    amount.innerHTML = args[1]
    category.innerHTML = args[2]

    updateCategoryTotal(args[2], args[1], args[1] < 0)
    saveTableAsCSV()

})

