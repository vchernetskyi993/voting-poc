package com.example.voting

import io.github.cdklabs.cdkhyperledgerfabricnetwork.FrameworkVersion
import io.github.cdklabs.cdkhyperledgerfabricnetwork.HyperledgerFabricClientProps
import io.github.cdklabs.cdkhyperledgerfabricnetwork.HyperledgerFabricNetwork
import io.github.cdklabs.cdkhyperledgerfabricnetwork.HyperledgerFabricNodeProps
import io.github.cdklabs.cdkhyperledgerfabricnetwork.InstanceType
import io.github.cdklabs.cdkhyperledgerfabricnetwork.NetworkEdition
import software.amazon.awscdk.CfnOutput
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
        createOutputs()
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

    private fun createOutputs() {
        CfnOutput.Builder.create(this, "AdminPasswordArn")
            .description("Secret ARN for the Hyperledger Fabric admin password")
            .value(network.adminPasswordSecret.secretFullArn ?: network.adminPasswordSecret.secretArn)
            .build()
        CfnOutput.Builder.create(this, "AdminPrivateKeyArn")
            .description("Secret ARN for Hyperledger Fabric admin private key")
            .value(network.adminPrivateKeySecret.secretFullArn ?: network.adminPrivateKeySecret.secretArn)
            .build()
        CfnOutput.Builder.create(this, "AdminSignedCertArn")
            .description("Secret ARN for Hyperledger Fabric admin signed certificate")
            .value(network.adminSignedCertSecret.secretFullArn ?: network.adminSignedCertSecret.secretArn)
            .build()
    }
}
