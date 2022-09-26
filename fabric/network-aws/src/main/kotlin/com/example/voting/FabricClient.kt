package com.example.voting

import io.github.cdklabs.cdkhyperledgerfabricnetwork.HyperledgerFabricNetwork
import software.amazon.awscdk.Environment
import software.amazon.awscdk.services.ec2.AmazonLinuxImage
import software.amazon.awscdk.services.ec2.CfnKeyPair
import software.amazon.awscdk.services.ec2.IVpc
import software.amazon.awscdk.services.ec2.Instance
import software.amazon.awscdk.services.ec2.InstanceClass
import software.amazon.awscdk.services.ec2.InstanceSize
import software.amazon.awscdk.services.ec2.InstanceType
import software.amazon.awscdk.services.ec2.Peer
import software.amazon.awscdk.services.ec2.Port
import software.amazon.awscdk.services.ec2.SecurityGroup
import software.amazon.awscdk.services.ec2.SubnetSelection
import software.amazon.awscdk.services.ec2.SubnetType
import software.amazon.awscdk.services.ec2.UserData
import software.constructs.Construct
import java.net.URL
import kotlin.io.path.Path
import kotlin.io.path.readText

data class FabricClientProps(
    val vpc: IVpc,
    val network: HyperledgerFabricNetwork,
    val env: Environment,
)

fun buildFabricClient(
    scope: Construct,
    props: FabricClientProps,
): Instance = createEc2(Construct(scope, "FabricClient"), props)

private fun createEc2(scope: Construct, props: FabricClientProps) =
    Instance.Builder.create(scope, "FabricEC2Client")
        .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.SMALL))
        .machineImage(AmazonLinuxImage())
        .userData(UserData.custom(prepareUserDataScript(props.network, props.env)))
        .vpc(props.vpc)
        .vpcSubnets(SubnetSelection.builder().subnetType(SubnetType.PUBLIC).build())
        .securityGroup(createSecurityGroup(scope, props.vpc))
        .keyName(createKeyPair(scope).keyName)
        .build()

private fun createSecurityGroup(scope: Construct, vpc: IVpc): SecurityGroup {
    val securityGroup = SecurityGroup.Builder.create(scope, "FabricEC2SecurityGroup")
        .vpc(vpc)
        .description("Elections client security group")
        .build()

    val deployerIp = URL("https://checkip.amazonaws.com").readText().trim()

    securityGroup.addIngressRule(
        Peer.ipv4("$deployerIp/32"),
        Port.tcp(22)
    )

    return securityGroup
}

private fun createKeyPair(scope: Construct) = CfnKeyPair.Builder.create(scope, "FabricEC2KeyPair")
    .keyName("FabricEC2Key")
    .keyType("ed25519")
    .build()

private fun prepareUserDataScript(network: HyperledgerFabricNetwork, env: Environment) =
    Path(System.getProperty("user.dir"), "resources", "client-data.sh")
        .readText()
        .replace(
            "{{MEMBER_ID}}" to network.memberId,
            "{{ORDERING_SERVICE_ENDPOINT}}" to network.ordererEndpoint,
            "{{PEER_NODE_ENDPOINT}}" to network.nodes[0].endpoint,
            "{{FABRIC_CA_ENDPOINT}}" to network.caEndpoint,
            "{{TLS_CERT_URL}}" to
                    "https://s3.%s.amazonaws.com/%s.managedblockchain/etc/managedblockchain-tls-chain.pem"
                        .format(env.region, env.region)
        )
