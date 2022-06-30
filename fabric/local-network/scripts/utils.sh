#!/bin/bash

infoln() {
    printf "\033[0;34m%s\033[0m\n" "$1"
}

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
