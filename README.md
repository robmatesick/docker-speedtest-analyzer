# Docker Speedtest Analyzer

Automated docker speedtest analyzer tool with included web interface to monitor your internet speed connection over time. Setup at home on a machine such as a Raspberry Pi or a NAS (Synology, QNAP tested) and the container runs hourly speedtests. The speedtest results are displayed in an web interface as line graph(s) over the day.

This tool was created in reference to [this reddit post](https://www.reddit.com/r/technology/comments/43fi39/i_set_up_my_raspberry_pi_to_automatically_tweet/).  
It used [speedtest-cli](https://github.com/sivel/speedtest-cli) to make speedtests and log them into a CSV file.  
After that you can visit the web interface to view a hourly - time filterable reports about
your internet connectivity speed.

# Screenshot
![Statistic Screenshot](https://raw.githubusercontent.com/robmatesick/docker-speedtest-analyzer/main/screenshot_speedtest_analyzer_1.png)

# Facts
1. The speedtest runs hourly per default
2. nginx is prepared but not configured for SSL yet
3. data is saved in a _.csv_ under ```/var/www/html/data/result.csv```
4. First speedtest will be executed in container build

# Installation
The SpeedTest analyzer should to run out of the box with docker.

**Important:** To keep the history of speedtest within a rebuild of
the container please moint a volume in ``/var/www/html/data/``

### Setup:
1. Moint host volume onto ``/var/www/html/data/``
2. Map preferred host port on port _80_
3. Build container from image
4. Enjoy continious speed statistics after a while

# Environment variables
| Variable  | Type | Usage |  Example Value | Default |
| ------------- | ------------- | ------------- | ------------- | ------------- |
| CRONJOB_ITERATION  | integer  | Time between speedtests in minutes. Value 15 means the cronjob runs every 15 minutes. Keep undefined to run hourly. | 15 | 60 |
| SPEEDTEST_PARAMS  | string | Append extra parameter for cli command.<br/> `speedtest-cli --simple $SPEEDTEST_PARAMS` <br/> Check [parameter documentation](https://github.com/sivel/speedtest-cli#usage)  | --mini https://speedtest.test.fr | none |
| RETRY_ATTEMPTS | integer | Number of times to try speedtest before failing the test. Retrying improves the chance of getting results. A value less than 1 will result in 1 attempt | 8 | 10 |

# Config
You can configure the visualization frontend via ``appConfig.js``
copy the ``/js/appConfig.example.js`` into ``/data/appConfig.js`` (where your volume should be mounted).
Change ``let appConfig = {`` to ``appConfig = {`` in /data/appConfig.js

#### Libs used
1. Bootstrap
2. Chart.js
3. daterangepicker.js
4. moment.js
5. papaparse
6. speedtest-cli

#### License
I kindly ask not to re-distribute this repo on hub.docker.com if it's not indispensable.

##### Disclaimer / Off topic
I've written this small tool for private use on my Raspberry Pi.  
The original Twitter function is removed in this version.

If you want to contribute and report / fix bugs or bring the feature stuff written for your
own setup, don't be shy.
