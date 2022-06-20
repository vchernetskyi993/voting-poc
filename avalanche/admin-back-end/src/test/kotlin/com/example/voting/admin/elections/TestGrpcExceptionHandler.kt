package com.example.voting.admin.elections

import io.grpc.Status
import net.devh.boot.grpc.server.advice.GrpcAdvice
import net.devh.boot.grpc.server.advice.GrpcExceptionHandler
import org.slf4j.LoggerFactory

@GrpcAdvice
class TestGrpcExceptionHandler {
    private val log = LoggerFactory.getLogger(TestGrpcExceptionHandler::class.java)

    @GrpcExceptionHandler
    fun handleAny(e: Exception): Status {
        log.error(e.message, e)
        return Status.UNKNOWN
    }
}