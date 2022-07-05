#!/bin/sh

MAX_WAIT=5
ATTEMPTS=1

while [ ! -d "$DATA_PATH/tls" ]; do
  if [ $ATTEMPTS = $MAX_WAIT ]; then
    echo "No certificates generated. Exiting..."
    exit 1
  else
    echo 'waiting for service certificates...'
    ATTEMPTS=$((ATTEMPTS + 1))
    sleep 1
  fi
done

exec $COMMAND
