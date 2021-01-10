const Chart = require('chart.js')
const ChartDataLabels = require('chartjs-plugin-datalabels')

function initPieChart(is_expense)
{
    let expense_colors = [ '#ee1111', '#ffc40d', '#2d89ef', '#1e7145', '#7e3878', '#b91d47', '#da532c', '#e3a21a', '#2b5797', '#00aba9', '#9f00a7', '#603cba' ]
    //different color ordering because it seems weird, if you only have 1 income category, that it would be an all red chart
    let income_colors = [ '#1e7145', '#2d89ef', '#ffc40d', '#ee1111']
    var canvas = document.getElementById(is_expense ? 'expense-canvas' : 'income-canvas')
    let ctx = canvas.getContext('2d');
    let chart = new Chart(ctx, {
        type: 'pie',
        data: {
            datasets: [{
                datalabels: {
                    align: 'end',
                    color: 'black',
                    formatter: (value, context) => {
                        let sum = 0;
                        let data_values = context.chart.data.datasets[0].data
                        for (let i = 0; i < data_values.length; ++i){
                            sum += parseFloat(data_values[i]);
                        }
                        return (value*100 / sum).toFixed(2)+"%";
                    }
                },
                backgroundColor: is_expense ? expense_colors : income_colors
            }]
        },
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

            },
            tooltips: {
                mode: 'label',
                callbacks: {
                    label: function(tooltipItem, data) {
                        var dataset = data.datasets[tooltipItem.datasetIndex];
                        var meta = dataset._meta[Object.keys(dataset._meta)[0]];
                        var total = meta.total;
                        var currentValue = dataset.data[tooltipItem.index];
                        var percentage = parseFloat((currentValue/total*100).toFixed(2));
                        return currentValue + ' (' + Math.abs(percentage) + '%)';
                    },
                    title: function(tooltipItem, data) {
                        return data.labels[tooltipItem[0].index];
                    }

                }
            }
        }
    });

    if (is_expense) { // incomes do not have subcategorys so click event is unnecessary
        canvas.addEventListener('click', (event)=>{
            if (canvas.dataset.showingSubcats === 'true'){
                updateCategoryTotals(true)
                canvas.dataset.showingSubcats = 'false'
                return;
            }
            let element = chart.getElementAtEvent(event)

            if (element.length > 0){
                var slice_index = element[0]["_index"];
                var category = chart.data.labels[slice_index]
                
                getSubcategoryTotals(start_time, end_time, selected_user, category, (rows)=>{
                    subcat_labels = []
                    subcat_totals = []
                    for (let i = 0; i < rows.length; ++i){
                        subcat_labels.push(rows[i].subcategory)
                        subcat_totals.push((rows[i].total/100).toFixed(2))
                    }
                    updatePieChart(chart, category, subcat_labels, subcat_totals)
                })
                canvas.dataset.showingSubcats = 'true'
            }
        })
    }

    return chart
}

function initLineChart()
{
    var canvas = document.getElementById('net-income-canvas')
    let ctx = canvas.getContext('2d');
    let chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                fill: false,
                datalabels: {
                    align: 'top',
                    color: function(context) {
                        let index = context.dataIndex
                        let value = context.dataset.data[index]
                        return value < 0 ? 'red' : value > 0 ? 'green' : 'black'
                    }
                },
                backgroundColor: 'black',
                borderColor: 'gray'
            }]
        },
        options: {
            responsive: true,
            title: {
                text: 'Net Income',
                display : true,
                fontSize: 16
            },
            legend: { display: false },
            layout: { padding: { right : 20 }, },
            scales: {
                xAxes : [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Time'
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            return ''
                        }
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Net Income ($)'
                    }
                }]
            }
        }
    });

    return chart
}
function updatePieChart(chart, title, labels, values)
{
    chart.options.title.text = title 
    chart.data.labels = labels
    chart.data.datasets[0].data = values
    chart.update()
}

function updateLineChart(chart, labels, values)
{
    chart.data.datasets[0].data = values;
    chart.data.labels = labels
    chart.update()
}