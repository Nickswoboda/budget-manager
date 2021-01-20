let expense_categories = getExpenseCategories()

let selected_month = null

updateBudgetMonthSelect()
initCategoryBudgetSelect()

function updateBudgetMonthSelect()
{
    let select = document.getElementById("budget-month-select")

    getEarliestEntryDate((earliest) => {
        let earliest_date = new Date(earliest)
        earliest_date.setMinutes(earliest_date.getMinutes() + earliest_date.getTimezoneOffset())
        earliest_date.setDate(1)

        let date = new Date()
        date.setDate(1)
        date.setHours(0,0,0,0)

        let num_months = date.getMonth() - earliest_date.getMonth() + (12 * (date.getFullYear() - earliest_date.getFullYear())) + 1
        let index = 0
        while (num_months > 0){
            let label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            select.options[index] = new Option(label, date.getTime())

            date.setMonth(date.getMonth() - 1)
            --num_months
            ++index
        }

        //if there is no default date set yet. Should only happen once
        if (selected_month === null){
            selected_month = parseInt(select.value)
            updateBudgetTable()
        }
    })
    
    select.addEventListener('change', (event) =>{
        selected_month = parseInt(event.target.value)
        updateBudgetTable()
    })
}

function getExpenseCategories()
{
    if (!fs.existsSync("assets/categories.json")){
        console.log("Unable to load categories.json");
    }

    let data = fs.readFileSync("assets/categories.json")
    return JSON.parse(data).expense
}

function initCategoryBudgetSelect()
{
    let select = document.getElementById("cat-budget-select")

    while (select.options.length > 1){
        select.remove(0)
    }

    let category_names = Object.keys(expense_categories)
    for (let i = 0; i < category_names.length; ++i){
        select.options[i+1] = new Option(category_names[i], category_names[i])
    }

    select.addEventListener('change', (event) =>{
        updateBudgetTable(event.target.value)
    })
}

function fillInBudgetCells(row, budgeted, total)
{
    row.cells[1].innerHTML = budgeted.toFixed(2)
    row.cells[2].innerHTML = total.toFixed(2)

    let diff = budgeted + total
    row.cells[3].innerHTML = diff.toFixed(2) 
    row.cells[3].style.color = diff > 0 ? "green" : diff < 0 ? "red" : "black"; 
}

function updateBudgetTable(category = null)
{
    resetHTMLTable('budget-table')
    let table = document.getElementById('budget-table')

    if (!category){
        category = table.dataset.category
    }
    let categories = category === "All" ? Object.keys(expense_categories) : expense_categories[category]
    table.dataset.category = category

    let first_of_month = new Date(selected_month)
    let last_of_month = new Date(first_of_month.getFullYear(), first_of_month.getMonth() + 1, 0)

    for (let i = 0; i < categories.length; ++i){
        let row = table.insertRow(i+1)

        addCellToRow(row, 0, categories[i])
        addCellToRow(row, 1, "")
        addCellToRow(row, 2, "")
        addCellToRow(row, 3, "")

        if (category === "All"){
            getTotalCategoryBudget(selected_user, categories[i], (budgeted) => {
                getTotalByCategory(first_of_month.getTime(), last_of_month.getTime(), selected_user, categories[i], (total)=>{
                    fillInBudgetCells(row, budgeted / 100, total)
                })
            })
        }
        else {
            getSubcategoryBudget(selected_user, categories[i], (budgeted) => {
                getTotalBySubcategory(first_of_month.getTime(), last_of_month.getTime(), selected_user, categories[i], (total)=>{
                    fillInBudgetCells(row, budgeted / 100, total)
                })
            })
        }
    }
}