const sqlite3 = require('sqlite3')
const fs = require('fs')

var db = null;

function initDB(callback)
{
    db = new sqlite3.Database('assets/db.sqlite', (err) => {
        err ? console.log(err) : createTables(callback)
    })
}

function DBRun(query, callback)
{
    if (!db){
        initDB() 
        return;
    }

    db.run(query, (err) =>{ 
        if (err){
            console.log(err)
            console.log(query)
        } else if (callback){
            callback()
        }
    })
}

function DBGet(query, callback)
{
    if (!db){
        initDB() 
        return;
    }
    db.get(query, (err, row)=> {
        if (err){
            console.log(err)
            console.log(query)
        } else {
            callback(row)
        }
    })
}

function DBAll(query, callback)
{ 
    if (!db){
        initDB() 
        return;
    }
    db.all(query, (err, rows)=> {
        if (err){
            console.log(err)
            console.log(query)
        } else {
            callback(rows)
        }
    })
}

function getUTCDateTime(date)
{
    let datetime = date.setMinutes(date.getMinutes() - date.getTimezoneOffset())

    if (Number.isNaN(datetime)){
        return Number.MAX_SAFE_INTEGER
    } else {
        return datetime
    }
}

function createTables(callback)
{
    DBRun(`CREATE TABLE IF NOT EXISTS entries (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT, datetime INTEGER,
        amount INTEGER, category TEXT, subcategory TEXT, note TEXT)`)

    DBRun(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`)

    DBRun(`CREATE TABLE IF NOT EXISTS budgets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, category TEXT, subcategory TEXT, amount INTEGER)`, callback)
}

function insertEntry(user_id, date, amount, category, subcategory, note)
{
    let datetime = Date.parse(date)
    //store as cents to help reduce float imprecision
    let cents = (amount * 100).toFixed(0) 
    DBRun(`INSERT INTO entries (user_id, date, datetime, amount, category, subcategory, note) 
            VALUES(${user_id}, '${date}', ${datetime}, ${cents}, '${category}', '${subcategory}', '${note}')`) 
}

function getAllEntries(start = 0, end = Number.MAX_SAFE_INTEGER, user_id = -1, callback)
{
    DBAll(`SELECT entries.id, name, date, amount, category, subcategory, note FROM entries 
            JOIN users
            ON users.id = entries.user_id
            WHERE (${user_id} < 0 OR user_id = ${user_id}) AND datetime >= ${start} AND datetime <= ${end} 
            ORDER BY datetime DESC`, callback)
}
function getEarliestEntryDate(callback)
{
    DBGet(`SELECT MIN(datetime) as date from entries`, (row) => {
        callback(row.date)
    })
}

function updateEntry(id, user_id, date, amount, category, subcategory, note)
{
    let datetime = Date.parse(date)
    //store as cents to help reduce float imprecision
    let cents = (amount * 100).toFixed(0) 
    DBRun(`UPDATE entries 
            SET user_id=${user_id}, date='${date}', datetime=${datetime}, amount=${cents}, category='${category}', subcategory='${subcategory}', note='${note}' 
            WHERE id=${id}`)
}

function deleteEntry(id)
{
    DBRun(`DELETE FROM entries WHERE id=${id}`)
}

function deleteEntriesByUser(user_id)
{
    DBRun(`DELETE FROM entries WHERE user_id=${user_id}`)
    DBRun(`DELETE FROM budgets WHERE user_id=${user_id}`)
}

function insertUser(name)
{
    DBRun(`INSERT INTO users (name) VALUES('${name}')`, initUserBudgets.bind(null, name))
}

function checkIfUserExists(name, callback)
{
    DBGet(`SELECT id FROM users WHERE name = '${name}'`, (row) =>{
        callback(row) 
    })
}
function initUserBudgets(name)
{
    DBGet(`SELECT id FROM users WHERE name = '${name}'`, (row) =>{
        let user_id = row.id
        if (!fs.existsSync("assets/categories.json")){
            console.log("Unable to load categories.json");
        }
        let data = fs.readFileSync("assets/categories.json")
        let expenses = JSON.parse(data).expense

        for (const [category, subcategories] of Object.entries(expenses)){
            for (let i = 0; i < subcategories.length; ++i){
                DBRun(`INSERT INTO budgets (user_id, category, subcategory, amount) VALUES (${user_id}, '${category}', '${subcategories[i]}', 0)`)
            }

            //for categories without subcategories. i.e Misc
            if (subcategories.length === 0){
                DBRun(`INSERT INTO budgets (user_id, category, subcategory, amount) VALUES (${user_id}, '${category}', '${category}', 0)`)
            }
        }
    })
}

function getSubcategoryBudget(user_id, subcategory, callback)
{
    //all users selected
    if (user_id < 0){
        DBGet(`SELECT amount FROM budgets WHERE subcategory = '${subcategory}'`, (row) => { callback(row.amount) })
    }else {
        DBGet(`SELECT amount FROM budgets WHERE user_id = ${user_id} AND subcategory = '${subcategory}'`, (row) => { callback(row.amount) })
    }
}

function getTotalCategoryBudget(user_id, category, callback)
{
    //all users selected
    if (user_id < 0){
        DBGet(`SELECT SUM(amount) as amount FROM budgets WHERE category = '${category}'`, (row) =>{ callback(row.amount) })
    } else {
        DBGet(`SELECT SUM(amount) as amount FROM budgets WHERE user_id=${user_id} AND category = '${category}'`, (row) =>{ callback(row.amount) })
    }
}

function updateSubcategoryBudget(user_id, subcategory, value)
{
    //storing as cents reduces loss of precision
    let cents = (value * 100).toFixed(0) 
    DBRun(`UPDATE budgets SET amount=${cents} WHERE user_id = ${user_id} AND subcategory='${subcategory}'`)
}

function updateUser(id, name)
{
    DBRun(`UPDATE users SET name=${name} WHERE id=${id}`)
}

function deleteUser(id)
{
    DBRun(`DELETE FROM users WHERE id=${id}`, deleteEntriesByUser.bind(null, id))
}

function getAllUsers(callback)
{
    DBAll(`SELECT id, name FROM users`, callback)
}

function getUserCount(callback)
{
    DBGet(`SELECT COUNT(*) as count FROM users`, (row) =>{callback(row.count) })
}

function getTotalByCategory(start = 0, end = Number.MAX_SAFE_INTEGER, user_id=-1, category, callback)
{
    start = getUTCDateTime(new Date(start)) 
    end = getUTCDateTime(new Date(end)) 
    DBGet(`SELECT SUM(amount) as total FROM entries
            WHERE (${user_id} < 0 OR user_id = ${user_id}) AND category='${category}' AND entries.amount < 0 
                AND entries.datetime >= ${start} AND datetime <= ${end}`, (row) => {
                    if (row.total === null){
                        callback(0)
                    } else {
                        callback(row.total/100)
                    }
                })
}
function getExpenseCategoryTotals(start = 0, end = Number.MAX_SAFE_INTEGER, user_id = -1, callback)
{
    DBAll(`SELECT category, SUM(amount) as total
            FROM entries 
            WHERE (${user_id} < 0 OR user_id = ${user_id}) AND entries.amount < 0 AND entries.datetime >= ${start} AND datetime <= ${end}
            GROUP BY category`, callback) 
}

function getIncomeCategoryTotals(start = 0, end = Number.MAX_SAFE_INTEGER, user_id = -1, callback)
{
    DBAll(`SELECT category, SUM(amount) as total
            FROM entries 
            WHERE (${user_id} < 0 OR user_id = ${user_id}) AND entries.amount > 0 AND entries.datetime >= ${start} AND datetime <= ${end}
            GROUP BY category`, callback)
}

function getSubcategoryTotals(start = 0, end = Number.MAX_SAFE_INTEGER, user_id = -1, category, callback)
{
    DBAll(`SELECT subcategory, category, SUM(amount) as total
            FROM entries 
            WHERE (${user_id} < 0 OR user_id = ${user_id}) AND category = '${category}' AND entries.amount < 0 AND entries.datetime >= ${start} AND datetime <= ${end}
            GROUP BY subcategory`, callback) 
}
function getTotalBySubcategory(start = 0, end = Number.MAX_SAFE_INTEGER, user_id=-1, subcategory, callback)
{
    DBGet(`SELECT SUM(amount) as total FROM entries
            WHERE (${user_id} < 0 OR user_id = ${user_id}) AND subcategory='${subcategory}' AND entries.amount < 0 
                AND entries.datetime >= ${start} AND datetime <= ${end}`, (row) =>{
                    if (row.total === null){
                        callback(0)
                    } else {
                        callback(row.total/100)
                    }
                })
}


function getNetIncomeByDate(start = 0, end = Number.MAX_SAFE_INTEGER, user_id = -1, callback)
{
    DBAll(`SELECT date, SUM(amount) as amount
            FROM entries 
            WHERE (${user_id} < 0 OR user_id = ${user_id}) AND datetime >= ${start} AND datetime <= ${end}
            GROUP BY date`, callback)
}