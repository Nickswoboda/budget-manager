const { ipcRenderer} = require('electron')
const Chart = require('chart.js')
const ChartDataLabels = require('chartjs-plugin-datalabels')

let start_time = 0
let end_time = Number.MAX_SAFE_INTEGER
let selected_user = -1

updateTables()
getAllUsers(updateUserSelection)

document.getElementById('start-date').valueAsDate = new Date()
document.getElementById('end-date').valueAsDate = new Date()

document.getElementById("user-select").addEventListener('change', (event) =>{
    selected_user = event.target.value
    updateTables(start_time, end_time, selected_user)
})

let custom_date_div = document.getElementById("custom-date-search");
document.getElementById("date-search-select").addEventListener('change', (event) =>{
    if (event.target.value === "custom"){
        custom_date_div.style.visibility = "visible";
    }
    else{
        custom_date_div.style.visibility = "hidden";

        let today = new Date()
        end_time = today.getTime()

        switch(event.target.value){
            case "all-time": start_time = 0; break;
            case "past-year": start_time = today.setFullYear(today.getFullYear() - 1); break;
            case "past-month": start_time = today.setMonth(today.getMonth() - 1); break;
            case "past-week": start_time = today.setDate(today.getDate() - 7); break;
        }
        updateTables(start_time, end_time, selected_user)
    }
})

document.getElementById("submit-btn").addEventListener('click', () =>{
    start_time = document.getElementById("start-date").valueAsDate.getTime()
    end_time = document.getElementById("end-date").valueAsDate.getTime()

    updateTables(start_time, end_time, selected_user)
})

function addCellToRow(row, cell_idx, text)
{
    let cell = row.insertCell(cell_idx)
    cell.innerHTML = text
    return cell
}

function updateNetIncome(row)
{
    if (row.expenses === null) row.expenses = 0;
    if (row.income === null) row.income = 0;

    let total = (row.expenses + row.income) / 100
    net_income = document.getElementById('net-income')
    net_income.innerHTML = total 
    net_income.style.color = total > 0 ? "green" : total < 0 ? "red" : "black"; 
}
function updateCategoryTotals(entries, is_expense)
{
    let category_labels =[]
    let values =[]

    for (let i = 0; i < entries.length; ++i){
        category_labels.push(entries[i].category)
        values.push((entries[i].total / 100).toFixed(2))
    }
    var canvas = document.getElementById(is_expense ? 'expense-canvas' : 'income-canvas')
    let ctx = canvas.getContext('2d');
    let chart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'pie',
    
        // The data for our dataset
        data: {
            labels: category_labels,
            datasets: [{
                datalabels: {
                    align: 'end',
                    color: '#FFFFFF',
                    formatter: (value, context) => {
                        return "" + entries[context.dataIndex].percentage + "%" 
                    }
                },
                
                data: values, 
                backgroundColor: [ 
                '#ee1111',
                '#ffc40d',
                '#2d89ef',
                '#1e7145',
                '#7e3878',
                '#b91d47',
                '#da532c',
                '#e3a21a',
                '#2b5797',
                '#00aba9',
                '#9f00a7',
                '#603cba'
                ]
            }]
        },
        // Configuration options go here
        options: {
            responsive: true,
            title: {
                display : true,
                text: is_expense ? 'Expenses' : 'Income',
                fontSize: 16
            },
            legend: {
                position: is_expense ? 'left' : 'right'
            }
        }
    });
    canvas.addEventListener('click', (event)=>{
        let element = chart.getElementAtEvent(event)

        if (element.length > 0){
            var slice_index = element[0]["_index"];
            var category = chart.data.labels[slice_index]
        }
    })
}

function addEntriesToTable(entries)
{
    let table = document.getElementById("history-table")
    
    for (let i = 0; i < entries.length; ++i){
        let row = table.insertRow(i+1)
        row.style.backgroundColor = entries[i].amount < 0 ? "red" : "green"

        let edit = addCellToRow(row, 0, "Edit") 
        edit.addEventListener("click", () =>{
            ipcRenderer.send('edit-entry-clicked', entries[i])
        })
        addCellToRow(row, 1, entries[i].name)
        addCellToRow(row, 2, entries[i].date)
        addCellToRow(row, 3, (entries[i].amount / 100).toFixed(2))
        addCellToRow(row, 4, entries[i].subcategory === "" ? entries[i].category : entries[i].subcategory)
        addCellToRow(row, 5, entries[i].note)
    }
}

function resetHTMLTable(table_name){
    let table = document.getElementById(table_name)
    let num_rows = table.rows.length
    for ( i = 1; i < num_rows; ++i){
        table.deleteRow(1)
    }
}
function resetHTMLTables()
{
    resetHTMLTable("history-table");
}

function updateTables()
{
    resetHTMLTables();
    getAllEntries(start_time, end_time, selected_user, addEntriesToTable)
    getCategoryTotals(start_time, end_time, selected_user, updateCategoryTotals)
    getNetIncome(start_time, end_time, selected_user, updateNetIncome)
}

function updateUserSelection(users)
{
    let user_select = document.getElementById('user-select')
    while (user_select.length > 1){
        user_select.remove(1)
    }
    for (let i = 0; i < users.length; ++i){
        user_select.options[i+1] = new Option(users[i].name, users[i].id)
    }

}

document.getElementById("expense-btn").addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked', true)
})

document.getElementById("income-btn").addEventListener('click', () =>{
    ipcRenderer.send('add-entry-clicked', false)
})

ipcRenderer.on('addEntry', (event, data) => {
    insertEntry(data.user_id, data.date, data.amount, data.category, data.subcategory, data.note) 
    updateTables()
})

ipcRenderer.on('update-entries', (event, data) => {
    updateEntry(data.id, data.user_id, data.date, data.amount, data.category, data.subcategory, data.note) 
    updateTables()
})

ipcRenderer.on('deleteEntry', (event, id) => {
    deleteEntry(id)
    updateTables()
})

ipcRenderer.on('users-updated', (event) => {
    updateTables()
    getAllUsers(updateUserSelection)
})