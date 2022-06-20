package com.example.voting.admin.elections

import net.devh.boot.grpc.client.inject.GrpcClient
import net.devh.boot.grpc.client.inject.GrpcClientBean
import org.springframework.context.annotation.Configuration
import voting.ElectionsGrpcKt.ElectionsCoroutineStub

@Configuration
@GrpcClientBean(
    clazz = ElectionsCoroutineStub::class,
    client = GrpcClient("electionsService"),
)
class ElectionsConfiguration
