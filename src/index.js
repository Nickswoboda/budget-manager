const { ipcRenderer, remote } = require('electron')
const fs = require('fs')

class Entry{
    constructor(date, amount, category){
        this.date = date 
        this.amount = amount 
        this.category = category
        this.is_expense = amount < 0 ? true : false
    }
}

var expense_total = 0
var income_total = 0
var history_data = []

loadTableFromCSV()

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

function updateCategoryTotal(entry)
{
    let table = entry.is_expense ? document.getElementById("expense-table") : document.getElementById("income-table")

    if (entry.is_expense){
        expense_total += entry.amount
    }else{
        income_total += entry.amount
    }

    for (i = 0; i < table.rows.length; ++i){
        row_category = table.rows[i].cells[0].innerHTML
        if (row_category === entry.category){
            let amount_cell = table.rows[i].cells[1]
            let new_amount = parseFloat(amount_cell.innerHTML) + entry.amount 
            amount_cell.innerHTML = new_amount
            updateTotalPercentages(entry.is_expense)
            return
        }
    }

    var new_row = table.insertRow(1)
    let category_cell = new_row.insertCell(0)
    let amount_cell = new_row.insertCell(1)

    category_cell.innerHTML = entry.category 
    amount_cell.innerHTML = entry.amount 

    new_row.insertCell(2)
    updateTotalPercentages(entry.is_expense)
}

function insertIntoHistory(entry)
{
    let left = 0
    let right = history_data.length

    let entry_date = new Date(entry.date)
    let entry_time = entry_date.getTime()
    while (left < right){
        let mid = Math.trunc((left +right) / 2)
        let history_entry = history_data[mid]
        let history_date = new Date(history_entry.date)
        let history_time = history_date.getTime()
        if (entry_time < history_time){
            right = mid
        }
        else{
            left = mid+1
        }
        
    }
    history_data.splice(left, 0, entry)
    return left 
}
function addEntry(entry)
{
    let table = document.getElementById("history-table")
    
    let index = insertIntoHistory(entry)
    let row = table.insertRow(index + 1)
    row.style.backgroundColor = entry.is_expense ? "red" : "green"

    let date = row.insertCell(0)
    let amount = row.insertCell(1)
    let category = row.insertCell(2)

    date.innerHTML = entry.date 
    amount.innerHTML = entry.amount 
    category.innerHTML = entry.category 

    updateCategoryTotal(entry)

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

    entries.forEach((value) => {
        let values = value.split(",")
        let entry = new Entry(values[0], parseFloat(values[1]), values[2])
        addEntry(entry)
    })
}


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
    let entry = new Entry(args[0], parseFloat(args[1]), args[2])
    addEntry(entry)

    saveTableAsCSV()
})

