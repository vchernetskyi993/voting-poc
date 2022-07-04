#!/bin/sh

while [ ! -d "$DATA_PATH/msp" ]; do
  echo 'waiting for data to become ready...'
  sleep 1
done

exec $COMMAND
