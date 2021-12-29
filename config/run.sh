#!/usr/bin/env bash
echo "Starting run.sh"

TMP_FILE=/tmp/crontab.$$

cat /var/www/html/config/crontab.default > ${TMP_FILE}

if [[ ${CRONJOB_ITERATION} && ${CRONJOB_ITERATION-x} ]]; then
    #sed -i -e "s/0/\*\/${CRONJOB_ITERATION}/g" ${TMP_FILE}
    sed -i -e "s/0/${CRONJOB_ITERATION}/g" ${TMP_FILE}
fi
crontab ${TMP_FILE}

echo "Starting Cronjob"
#crond -l 2 -f &
service cron start

echo "Starting nginx"
exec nginx -g "daemon off;"

exit 0;