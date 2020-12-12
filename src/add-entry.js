const {ipcRenderer, remote} = require('electron')
const fs = require('fs')

var expense = true
var entry_edited = null
var win = remote.getCurrentWindow()

income_categories = []
expense_categories = {}

//set date as todays date by default
document.getElementById('date-input').valueAsDate = new Date()
document.getElementById('category-input').addEventListener('change', () =>{
    if (!expense) return;
    
    let category = document.getElementById('category-input').value.toString()
    setSubcategories(category)
})

function setSubcategories(category)
{
    let subcat_box = document.getElementById('subcat-input')

    while (subcat_box.options.length > 0){
        subcat_box.remove(0)
    }

    let subcategories = expense_categories[category]
    for (let i = 0; i < subcategories.length; ++i){
        subcat_box.options[subcat_box.options.length] = new Option(subcategories[i], subcategories[i])
    }
}

function setCategories(is_expense){
    let categories = is_expense ? Object.keys(expense_categories) : income_categories 

    let select_box = document.getElementById('category-input')

    for (let i = 0; i < categories.length; ++i){
        select_box.options[select_box.options.length] = new Option(categories[i], categories[i])
    }

    if (is_expense){
        setSubcategories(categories[0])
    }
}

function loadCategories()
{
    if (!fs.existsSync("assets/categories.json")){
        console.log("Unable to load categories.json");
    }

    let data = fs.readFileSync("assets/categories.json")
    let json = JSON.parse(data)

    income_categories = json.income
    expense_categories = json.expense

}

function isValidInput()
{
    let date = document.getElementById('date-input').valueAsDate
    let todays_date = new Date()
    if (date > todays_date) return false;
    if (date.getFullYear() < 1000 || date.getFullYear() > 3000) return false
    if (date.getMonth() < 0 || date.getMonth() > 12) return false

    let days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if (date.getDate() < 1 || date.getDate() > days_in_month[date.getMonth()]) return false

    let amount = document.getElementById('amount-input').valueAsNumber
    if (isNaN(amount) || amount === 0) return false

    return true
}
document.getElementById('submit-btn').addEventListener('click', () =>{
    if (!isValidInput()) return

    let value = parseFloat(document.getElementById('amount-input').value.toString())

    var data = {
        date : document.getElementById('date-input').value.toString(),
        amount : expense ? -value : value,
        category : document.getElementById('category-input').value.toString(),
        subcategory : document.getElementById('subcat-input').value.toString(),
        id: entry_edited === null ? -1 : entry_edited.id,
        note : document.getElementById('note-input').value.toString()
    }

    ipcRenderer.send('entry-submitted', data)
    win.close()
})

document.getElementById('cancel-btn').addEventListener('click', () =>{
    win.close()
})

delete_btn = document.getElementById('delete-btn').addEventListener('click', () =>{
    ipcRenderer.send('delete-entry-requested', entry_edited.id);
})

ipcRenderer.on('initialize-popup', (event, is_expense, entry) =>{
    entry_edited = entry
    expense = is_expense

    loadCategories()
    setCategories(is_expense)

    if (!is_expense){
        let subcat_input = document.getElementById('subcat-input')
        subcat_input.style.visibility = 'hidden'
    }
    if (entry === null){
        let delete_btn = document.getElementById('delete-btn')
        delete_btn.style.visibility = 'hidden'
    } else {
        let date = new Date(entry.date)
        document.getElementById('date-input').valueAsDate = date
        document.getElementById('amount-input').value = Math.abs(entry.amount) 
        document.getElementById('category-input').value = entry.category
        document.getElementById('subcat-input').value = entry.subcategory
        document.getElementById('note-input').value = entry.note
    }

})