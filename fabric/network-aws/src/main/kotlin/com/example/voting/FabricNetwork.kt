package com.example.voting

import io.github.cdklabs.cdkhyperledgerfabricnetwork.FrameworkVersion
import io.github.cdklabs.cdkhyperledgerfabricnetwork.HyperledgerFabricNetwork
import io.github.cdklabs.cdkhyperledgerfabricnetwork.HyperledgerFabricNodeProps
import io.github.cdklabs.cdkhyperledgerfabricnetwork.InstanceType
import io.github.cdklabs.cdkhyperledgerfabricnetwork.NetworkEdition
import software.constructs.Construct

fun buildNetwork(scope: Construct): HyperledgerFabricNetwork =
    HyperledgerFabricNetwork.Builder.create(scope, "ElectionsNetwork")
        .networkEdition(NetworkEdition.STARTER)
        .frameworkVersion(FrameworkVersion.VERSION_2_2)
        .networkName("ElectionsNetworkName")
        .networkDescription("Sample POC network for elections process")
        .memberName("Government")
        .memberDescription("Main organization responsible for network management")
        .nodes(
            listOf(
                HyperledgerFabricNodeProps.builder()
                    .availabilityZone("us-east-1a")
                    .instanceType(InstanceType.BURSTABLE3_SMALL)
                    .build()
            )
        )
        .build()
