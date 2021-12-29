// Custom function for building buttons
let ButtonHlpr = function(btn){
    let button = jQuery(btn);
    this.loading = function(){
        button.html(button.data('loading-text'));
    };

    this.reset = function(){
        button.html(button.data('original-text'));
    };
};

// Custom function to extend an
const extend = function(out) {
    out = out || {};

    for (var i = 1; i < arguments.length; i++) {
        if (!arguments[i])
            continue;

        for (var key in arguments[i]) {
            if (arguments[i].hasOwnProperty(key))
                out[key] = arguments[i][key];
        }
    }

    return out;
};

// Configuration

let colors = {
    orange: "rgba(255,190,142,0.5)",
    black: "rgba(90,90,90,1)",
    green: "rgba(143,181,178,0.8)"
};

let data = {
    labels:[] ,
    datasets: [
        {
            label: appConfig.labels.ping,
            isMB: false,
            fill: false,
            backgroundColor: colors.black,
            borderColor: colors.black,
            tension: 0
        },
        {
            label: appConfig.labels.upload,
            isMB: true,
            fill: false,
            backgroundColor: colors.green,
            borderColor: colors.green,
            tension: 0
        },
        {
            label: appConfig.labels.download,
            isMB: true,
            fill: true,
            backgroundColor: colors.orange,
            borderColor: colors.orange,
            tension: 0
        }
    ]
};

// When DOM is loaded...
document.addEventListener('DOMContentLoaded', function() {
    // Override title with custom value
    if (appConfig.customTitle){
        document.title = appConfig.customTitle;
    }

    // Setup the chart
    let chartDom = document.getElementById('speedtest-chart').getContext('2d');
    let chartJS = new Chart(chartDom, {
        type: "line",
        data: data,
        options: {
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                tooltip: {
                    position: 'nearest',
                    callbacks: {
                        label: function(tooltipItems) {
                            let sLabel = tooltipItems.dataset.label + ": " + tooltipItems.formattedValue;
                            if (tooltipItems.dataset.isMB) {
                                sLabel += " Mbps";
                            }
                            return sLabel;
                        }
                    }
                }
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            responsive: true,
            multiTooltipTemplate: "<%if (datasetLabel){%><%=datasetLabel%>: <%}%><%= value %> <%if (datasetLabel != appConfig.labels.ping){%>MBits/s<%}%>"
        }
    });

    // Setup and invoke the data parser
    let ParseManager = function(){
        let parseManager = this;
        parseManager.header = null;
        parseManager._startDate = null;
        parseManager._endDate = null;
        parseManager._chart = null;
        parseManager.i = 0;
        parseManager.uploadCount = 0;
        parseManager.downloadCount = 0;

        /**
         * Parse result.csv and create graph with _startDate and _endDate filter
         */
        parseManager.parse = function(){
            let parseManager = this;
            parseManager.i = 0;

            Papa.parse("data/result.csv", {
                download: true,
                step: function(row) { // using stream to allow huge file progressing
                    parseManager.i++;
                    let dataArr = row.data;
                    if (!parseManager.header || parseManager.i === 1){
                        parseManager.header = dataArr;
                    } else {
                        // build CSV array
                        let measureRow = [];
                        for (i = 0; i < dataArr.length; i++) {
                            measureRow[parseManager.header[i]] = dataArr[i];
                        }
                        measureRow['timestamp_s'] = parseInt(measureRow['timestamp'] / 1000); // from ms timestamp to secounds
                        measureRow['timestamp'] = parseInt(measureRow['timestamp']); // from save ms timestamp

                        if (!!parseManager._startDate && !!parseManager._endDate){
                            if (measureRow['timestamp_s'] < parseManager._startDate.unix() || measureRow['timestamp_s'] > parseManager._endDate.unix()){
                                // not in filter
                                return;
                            }
                        }

                        parseManager.addRow(measureRow);
                    }
                }
            });
        };

        /**
         * add a row to chart
         *
         * @param measureRow
         */
        parseManager.addRow = function(measureRow){
            let chart = parseManager._chart;
            let chartData = chart.config.data;
            chartData.labels.push(this.getDateFromData(measureRow));

            if (parseFloat(measureRow['upload']) > parseFloat(measureRow['download'])){
                parseManager.uploadCount++;
            } else {
                parseManager.downloadCount++;
            }

            chartData.datasets[0].data.push(
                measureRow['ping']
            );
            chartData.datasets[1].data.push(
                measureRow['upload']
            );
            chartData.datasets[2].data.push(
                measureRow['download']
            );

            /**
             * graph has to be filled dynamically whether upload or download is higher. See issue #10
             */
            let total = parseManager.uploadCount + parseManager.downloadCount;
            let largerValue = 0;
            if (parseManager.uploadCount > parseManager.downloadCount){
                chartData.datasets[1].fill = "+1"; //fill upload till download line
                chartData.datasets[2].fill = "origin";
                largerValue = parseManager.uploadCount;
            } else {
                //upload lower than download -> priority for upload
                chartData.datasets[1].fill = "origin";
                chartData.datasets[2].fill = "-1"; //fill download starting @ upload line
                largerValue = parseManager.downloadCount;
            }

            let percentDominated = largerValue * 100 / total;
            if (percentDominated < 70){ //threshold
                //no fill for upload because more than 30% overlapping
                chartData.datasets[1].fill = false;
                chartData.datasets[2].fill = true;
            }

            parseManager._chart.config.data = chartData;
            chart.update();
        };

        parseManager.flushChart = function(force, callback){
            let parseManager = this;
            let chart = parseManager._chart;

            parseManager.uploadCount = 0;
            parseManager.downloadCount = 0;

            chart.data.labels = [];
            chart.data.datasets.forEach(function(dataSet){
                dataSet.data = [];
            });

            parseManager._chart.update();
            callback();
            return true;
        };


        parseManager.getDateFromData = function(measureRow){
            return moment(new Date(measureRow['timestamp'])).format('L - LT')
        };


        /**
         * Set start date as filter
         * @param startDate
         * @returns {ParseManager}
         */
        parseManager.setStartDate = function(startDate){
            parseManager._startDate = startDate;
            return parseManager;
        };

        /**
         * Set end date as filter
         * @param endDate
         * @returns {ParseManager}
         */
        parseManager.setEndDate = function(endDate){
            parseManager._endDate = endDate;
            return parseManager;
        };

        /**
         * Set the chart
         * @param chart {*|e}
         * @returns {ParseManager}
         */
        this.setChart = function(chart){
            this._chart = chart;
            return this;
        };

        /**
         * Set a new filter and update the graph
         * @param startDate
         * @param endDate
         */
        this.update = function(startDate, endDate){
            let parseManager = this;
            parseManager._startDate = startDate;
            parseManager._endDate = endDate;

            parseManager.flushChart(true, function(){
                parseManager.parse();
            });
        };


    };  // end ParseManager


    let daterangeConfig = {
        locale: {
            format: appConfig.dateFormat
        },
        "autoApply": true,
        "opens": "left"
    };

    // let combinedConfig = extend(daterangeConfig, appConfig.daterange);
    // console.log("DEBUG combinedConfig", combinedConfig);
    jQuery.extend(daterangeConfig, appConfig.daterange);


    // Main action

    let parseManager = new ParseManager();
    parseManager.setChart(chartJS);
    
    // Note that Bootstrap DateRangePicker requires use of jQuery
    let dateRange = jQuery('#daterange')
    dateRange.daterangepicker(
        daterangeConfig,
        (start, end) => {
            parseManager.update(start,end);
        }
    );

    moment.locale(appConfig.locale);

    if (appConfig.daterange.startDate && appConfig.daterange.endDate){
        parseManager
            .setStartDate(appConfig.daterange.startDate)
            .setEndDate(appConfig.daterange.endDate);
    }
    parseManager.parse();

    document.querySelector('#startSpeedtest').addEventListener('click', function () {
        // console.log('DEBUG: button clicked!')
        let buttonHelper = new ButtonHlpr(this);

        buttonHelper.loading();

        fetch('/run_speedtest')
            .then(async response => {
                const data = await response.text();

                // check for error response
                if (!response.ok) {
                    // get error message from body or default to response status
                    const error = (data && data.message) || response.status;
                    return Promise.reject(error);
                }

                // console.log('DEBUG: Response:', data);
                buttonHelper.reset();
                parseManager.flushChart(true, function(){
                    parseManager.parse();
                });
            })
            .catch(error => {
                console.error('There was an error requesting a speedtest!', error);
            });

    });  // end of button click

    // Auto-refresh data on occasion
    setTimeout(() => {
        console.log('Refreshing data...');
        parseManager.flushChart(true, function(){
            parseManager.parse();
        });
    }, 60000);  // 1 minute interval


});