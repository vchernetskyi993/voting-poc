package com.example.voting

import io.github.cdklabs.cdkhyperledgerfabricnetwork.FrameworkVersion
import io.github.cdklabs.cdkhyperledgerfabricnetwork.HyperledgerFabricClientProps
import io.github.cdklabs.cdkhyperledgerfabricnetwork.HyperledgerFabricNetwork
import io.github.cdklabs.cdkhyperledgerfabricnetwork.HyperledgerFabricNodeProps
import io.github.cdklabs.cdkhyperledgerfabricnetwork.InstanceType
import io.github.cdklabs.cdkhyperledgerfabricnetwork.NetworkEdition
import software.amazon.awscdk.services.ec2.IVpc
import software.constructs.Construct

class FabricNetworkProps {
    lateinit var vpc: IVpc
}

class FabricNetwork(
    scope: Construct,
    id: String,
    init: FabricNetworkProps.() -> Unit,
) : Construct(scope, id) {
    val network: HyperledgerFabricNetwork

    init {
        val props = FabricNetworkProps()
        props.init()

        network = buildNetwork(props.vpc)
    }

    private fun buildNetwork(vpc: IVpc): HyperledgerFabricNetwork =
        HyperledgerFabricNetwork.Builder.create(this, "ElectionsNetwork")
            .networkEdition(NetworkEdition.STARTER)
            .frameworkVersion(FrameworkVersion.VERSION_2_2)
            .networkName("ElectionsNetworkName")
            .networkDescription("Sample POC network for elections process")
            .memberName("Government")
            .memberDescription("Main organization responsible for network management")
            .client(
                HyperledgerFabricClientProps.builder()
                    .vpc(vpc)
                    .build()
            )
            .nodes(
                listOf(
                    HyperledgerFabricNodeProps.builder()
                        .availabilityZone("us-east-1a")
                        .instanceType(InstanceType.BURSTABLE3_SMALL)
                        .build()
                )
            )
            .build()
}
