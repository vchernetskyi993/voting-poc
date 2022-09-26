package com.example.voting

import io.github.cdklabs.cdkhyperledgerfabricnetwork.HyperledgerFabricNetwork
import software.amazon.awscdk.Stack
import software.amazon.awscdk.StackProps
import software.amazon.awscdk.services.ec2.IVpc
import software.amazon.awscdk.services.ec2.Instance
import software.amazon.awscdk.services.ec2.InterfaceVpcEndpointOptions
import software.amazon.awscdk.services.ec2.InterfaceVpcEndpointService
import software.amazon.awscdk.services.ec2.Port
import software.amazon.awscdk.services.ec2.SecurityGroup
import software.amazon.awscdk.services.ec2.SubnetFilter
import software.amazon.awscdk.services.ec2.SubnetSelection
import software.amazon.awscdk.services.ec2.SubnetType
import software.amazon.awscdk.services.ec2.Vpc
import software.constructs.Construct


fun buildElectionsStack(scope: Construct, props: StackProps) {
    val stack = Stack(scope, "ElectionsAwsStack", props)
    val fabricVpc = createVpc(stack)

    val fabricNetwork = buildNetwork(stack)

    val client = buildFabricClient(
        stack,
        FabricClientProps(
            vpc = fabricVpc,
            network = fabricNetwork,
            env = props.env ?: throw IllegalArgumentException("Environment param is required"),
        ),
    )

    fabricVpc.addFabricEndpoint(stack, fabricVpc, fabricNetwork, client)
}

private fun createVpc(scope: Construct): Vpc =
    Vpc.Builder.create(scope, "ElectionVpc")
        .cidr("10.0.0.0/16")
        .build()

private fun Vpc.addFabricEndpoint(
    scope: Construct,
    vpc: IVpc,
    network: HyperledgerFabricNetwork,
    client: Instance,
) {
    val securityGroup = SecurityGroup.Builder.create(scope, "FabricNetworkEndpointSecurityGroup")
        .vpc(vpc)
        .description("Elections VPC endpoint security group")
        .build()

    securityGroup.connections.allowFrom(client, Port.allTcp())

    addInterfaceEndpoint(
        "FabricNetworkEndpoint",
        InterfaceVpcEndpointOptions.builder()
            .service(InterfaceVpcEndpointService(network.vpcEndpointServiceName))
            .subnets(
                SubnetSelection.builder()
                    .subnetType(SubnetType.PUBLIC)
                    .subnetFilters(listOf(SubnetFilter.byIds(listOf(client.instance.subnetId))))
                    .build()
            )
            .securityGroups(listOf(securityGroup))
            .privateDnsEnabled(true)
            .build()
    )
}
