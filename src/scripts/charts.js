const Chart = require('chart.js')
const ChartDataLabels = require('chartjs-plugin-datalabels')

function initChart(is_expense)
{
    var canvas = document.getElementById(is_expense ? 'expense-canvas' : 'income-canvas')
    let ctx = canvas.getContext('2d');
    let chart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'pie',
    
        // The data for our dataset
        data: {
            datasets: [{
                datalabels: {
                    align: 'end',
                    color: '#FFFFFF',
                    formatter: (value, context) => {
                        let sum = 0;
                        let data_values = context.chart.data.datasets[0].data
                        for (let i = 0; i < data_values.length; ++i){
                            sum += parseFloat(data_values[i]);
                        }
                        return (value*100 / sum).toFixed(2)+"%";
                    }
                },
                
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
                fontSize: 16
            },
            legend: {
                position: is_expense ? 'left' : 'right',
                onClick: (event) => {
                    event.stopPropagation()
                }

            }
        }
    });


    if (is_expense) { // incomes do not have subcategorys so click event is unnecessary
        canvas.addEventListener('click', (event)=>{
            if (canvas.dataset.showingSubcats === 'true'){
                getCategoryTotals(start_time, end_time, selected_user, updateCategoryTotals)
                canvas.dataset.showingSubcats = 'false'
                return;
            }
            let element = chart.getElementAtEvent(event)

            if (element.length > 0){
                var slice_index = element[0]["_index"];
                var category = chart.data.labels[slice_index]
                
                getSubcategoryTotals(start_time, end_time, selected_user, (rows)=>{
                    subcat_labels = []
                    subcat_totals = []
                    for (let i = 0; i < rows.length; ++i){
                        if (rows[i].category === category){
                            subcat_labels.push(rows[i].subcategory)
                            subcat_totals.push((rows[i].total/100).toFixed(2))
                        }
                    }
                    updateChart(chart, category, subcat_labels, subcat_totals)
                })
                canvas.dataset.showingSubcats = 'true'
            }
        })
    }

    return chart
}

function updateChart(chart, title, labels, values)
{
    chart.options.title.text = title 
    chart.data.labels = labels
    chart.data.datasets[0].data = values
    chart.update()
}