#!/bin/sh

#######################################
# Print line of text formatted as INFO log.
# Arguments:
#   Text to print.
#######################################
infoln() {
  printf "\033[0;34m%s\033[0m\n" "$1"
}

#######################################
# Trap all errors:
#   * exit immediately on any error
#   * print function name, line name and error message.
#######################################
trapErrors() {
  set -eE

  failure() {
    local func=$1
    local line=$2
    local msg=$3
    echo "function '$func' failed at $line: $msg"
  }
  trap 'failure ${FUNCNAME} ${LINENO} "$BASH_COMMAND"' ERR
}
