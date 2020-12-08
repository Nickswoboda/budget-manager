let start_time = 0;
let end_time = Infinity

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
            case "all-time": 
                start_time = 0
                break;
            case "past-year": 
                start_time = today.setFullYear(today.getFullYear() - 1);
                break;
            case "past-month": 
                start_time = today.setMonth(today.getMonth() - 1);
                break;
            case "past-week": 
                start_time = today.setDate(today.getDate() - 7);
                break;
        }

        let entries = getVisibleEntries(start_time, end_time)
        showEntriesInTable(entries)
    }
})

document.getElementById("submit-btn").addEventListener('click', () =>{
    start_time = document.getElementById("start-date").valueAsDate.getTime()
    end_time = document.getElementById("end-date").valueAsDate.getTime()

    let entries = getVisibleEntries(start_time, end_time)
    showEntriesInTable(entries)
})

function getVisibleEntries(start, end)
{
    visible_entries = []
    if (history_data.length === 0) return []
    if (history_data[0].getTime() < start) return []
    if (history_data[history_data.length-1] > end) return []

    let index = getDataInsertionIndex(end, false)

    let valid_entries = []
    while (index < history_data.length){
        let entry = history_data[index]
        if (entry.getTime() >= start){
            valid_entries.push(entry)
            ++index;
        }
        else{
            break;
        }
    }

    return valid_entries;
}

function getDataInsertionIndex(time, visible_only)
{
    if (visible_only){
        if (time < start_time || time > end_time){
            return -1;
        }
    }

    let data = visible_only ? visible_entries : history_data
    
    let left = 0
    let right = data.length
    while (left < right){
        mid = (left + right) >>> 1
        if (data[mid].getTime() > time){
            left = mid + 1
        }else{
            right = mid
        }
    }
    return left
}