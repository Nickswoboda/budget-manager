const { remote } = require("electron")
const fs = require('fs')

categories = getCategoriesFromFile()
initDB()
initUserSelect()
initCategorySelect()

function initUserSelect()
{
    let user_select = document.getElementById('user-select')

    getAllUsers((users) => {
        console.log(users)
        for (let i = 0; i < users.length; ++i){
            user_select.options[i] = new Option(users[i].name, parseInt(users[i].id))
        }
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

    updateSubcategories(category_labels[0])

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

    for (let i = 0; i < subcategories.length; ++i){
        let subcat_label = document.createElement('h4')
        subcat_label.innerHTML = subcategories[i]
        subcat_div.appendChild(subcat_label)
    }

}
document.getElementById('close-btn').addEventListener('click', () => {
    remote.getCurrentWindow().close()
})

