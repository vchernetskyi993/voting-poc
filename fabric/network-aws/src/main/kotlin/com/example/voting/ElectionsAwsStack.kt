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
import software.amazon.awscdk.services.s3.Bucket
import software.amazon.awscdk.services.s3.IBucket
import software.amazon.awscdk.services.s3.deployment.BucketDeployment
import software.amazon.awscdk.services.s3.deployment.Source
import software.constructs.Construct


fun buildElectionsStack(scope: Construct, props: StackProps) {
    val stack = Stack(scope, "ElectionsAwsStack", props)
    val fabricVpc = createVpc(stack)

    val fabricNetwork = buildNetwork(stack)

    val bucket = createNetworkDataBucket(stack)

    val client = buildFabricClient(
        stack,
        FabricClientProps(
            vpc = fabricVpc,
            network = fabricNetwork,
            env = props.env ?: throw IllegalArgumentException("Environment param is required"),
            bucket = bucket,
        ),
    )

    fabricVpc.addFabricEndpoint(stack, fabricVpc, fabricNetwork, client)
}

private fun createVpc(scope: Construct): Vpc =
    Vpc.Builder.create(scope, "ElectionVpc")
        .cidr("10.0.0.0/16")
        .build()

private fun createNetworkDataBucket(scope: Construct): IBucket {
    val bucket = Bucket(scope, "ElectionsNetworkData")
    BucketDeployment.Builder.create(scope, "DeployNetworkData")
        .destinationBucket(bucket)
        .sources(listOf(Source.data("configtx.yaml", readResource("configtx.yaml"))))
        .build()
    return bucket
}

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
