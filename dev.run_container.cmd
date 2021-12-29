cd /d %~dp0

docker run --rm -p 8080:80 -v %CD%:/var/www/html -e CRONJOB_ITERATION=5,20,35,50 rmaz410/sta