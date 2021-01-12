const { remote, ipcRenderer } = require("electron")
const prompt = require('electron-prompt')

categories = getCategoriesFromFile()
initDB()
initCategorySelect()
initUserSelect()

function initUserSelect()
{
    let user_select = document.getElementById('user-select')

    getAllUsers((users) => {
        if (users.length === 0){
            ipcRenderer.send('error-popup', 'You must add a user (File->Edit Users) before setting budgets.')
            remote.getCurrentWindow().close()
            return
        }
        for (let i = 0; i < users.length; ++i){
            user_select.options[i] = new Option(users[i].name, parseInt(users[i].id))
        }
        updateSubcategories(document.getElementById('category-select').value)
    })

    user_select.addEventListener('change', (event) =>{
        updateSubcategories(document.getElementById('category-select').value)
    })

}

function getCategoriesFromFile()
{
    if (!fs.existsSync("assets/categories.json")){
        console.log("Unable to load categories.json");
    }

    let data = fs.readFileSync("assets/categories.json")
    return JSON.parse(data).expense
}
function initCategorySelect()
{
    let category_select = document.getElementById('category-select')

    category_labels = Object.keys(categories)

    for (let i = 0; i < category_labels.length; ++i){
        category_select.options[i] = new Option(category_labels[i])
    }

    category_select.addEventListener('change', (event) =>{
        updateSubcategories(event.target.value)
    })
}

function updateSubcategories(category)
{
    let subcat_div = document.getElementById('subcat-div')
    while (subcat_div.childNodes.length > 0){
        subcat_div.removeChild(subcat_div.childNodes[0])
    }
    
    let subcategories = categories[category]
    let user_id = document.getElementById('user-select').value

    for (let i = 0; i < subcategories.length; ++i){
        getSubcategoryBudget(user_id, subcategories[i], (value) => {
            let subcat_label = document.createElement('label')
            subcat_label.id = subcategories[i] + '-label'
            subcat_label.innerHTML = subcategories[i] + ": $" + parseFloat(value).toFixed(2)

            let edit_btn = document.createElement('button')
            edit_btn.dataset.category = subcategories[i]
            edit_btn.innerHTML = "Change"

            subcat_div.appendChild(subcat_label)
            subcat_div.appendChild(edit_btn)
            subcat_div.innerHTML += '<br><br>'
        })

    }

}

function setSubcategoryBudget(subcategory, value)
{
    let subcat_label = document.getElementById(subcategory + '-label')
    subcat_label.innerHTML= subcategory + ": $" + parseFloat(value).toFixed(2)
    updateSubcategoryBudget(document.getElementById('user-select').value, subcategory, value)
}
document.getElementById('close-btn').addEventListener('click', () => {
    remote.getCurrentWindow().close()
})

document.getElementById('subcat-div').addEventListener('click', (event) => {
    if (event.target.tagName.toLowerCase() === 'button'){
        let subcategory = event.target.dataset.category

        prompt({
            title: 'Set Budget',
            label: subcategory,
            value: 0,
            inputAttrs : {
                type: 'number',
                step: '0.01'
            },
            type: 'input'
        }).then((result)=>{
            if (result){
                setSubcategoryBudget(subcategory, result)
            }
        })
    }
})