package com.example.voting

import software.amazon.awscdk.Environment
import software.amazon.awscdk.services.ec2.AmazonLinuxImage
import software.amazon.awscdk.services.ec2.CfnKeyPair
import software.amazon.awscdk.services.ec2.IVpc
import software.amazon.awscdk.services.ec2.Instance
import software.amazon.awscdk.services.ec2.InstanceClass
import software.amazon.awscdk.services.ec2.InstanceSize
import software.amazon.awscdk.services.ec2.InstanceType
import software.amazon.awscdk.services.ec2.InterfaceVpcEndpointOptions
import software.amazon.awscdk.services.ec2.InterfaceVpcEndpointService
import software.amazon.awscdk.services.ec2.Peer
import software.amazon.awscdk.services.ec2.Port
import software.amazon.awscdk.services.ec2.SecurityGroup
import software.amazon.awscdk.services.ec2.SubnetFilter
import software.amazon.awscdk.services.ec2.SubnetSelection
import software.amazon.awscdk.services.ec2.SubnetType
import software.amazon.awscdk.services.ec2.UserData
import software.constructs.Construct
import java.net.URL
import kotlin.io.path.Path
import kotlin.io.path.readText

class FabricClientProps {
    lateinit var vpc: IVpc
    lateinit var fabric: FabricNetwork
    lateinit var env: Environment
}

class FabricClient(
    scope: Construct,
    id: String,
    init: FabricClientProps.() -> Unit,
) : Construct(scope, id) {
    init {
        val props = FabricClientProps()
        props.init()

        val keyPair = CfnKeyPair.Builder.create(this, "FabricEC2KeyPair")
            .keyName("FabricEC2Key")
            .keyType("ed25519")
            .build()

        val userDataScript = props.fabric.network.let {
            Path(System.getProperty("user.dir"), "resources", "client-data.sh")
                .readText()
                .replace(
                    "{{MEMBER_ID}}" to it.memberId,
                    "{{ORDERING_SERVICE_ENDPOINT}}" to it.ordererEndpoint,
                    "{{PEER_NODE_ENDPOINT}}" to it.nodes[0].endpoint,
                    "{{FABRIC_CA_ENDPOINT}}" to it.caEndpoint,
                    "{{TLS_CERT_URL}}" to
                            "https://s3.%s.amazonaws.com/%s.managedblockchain/etc/managedblockchain-tls-chain.pem"
                                .format(props.env.region, props.env.region)
                )
        }

        val securityGroup = SecurityGroup.Builder.create(this, "FabricEC2SecurityGroup")
            .vpc(props.vpc)
            .description("Elections client security group")
            .build()

        val deployerIp = URL("https://checkip.amazonaws.com").readText().trim()

        securityGroup.addIngressRule(
            Peer.ipv4("$deployerIp/32"),
            Port.tcp(22)
        )

        val client = Instance.Builder.create(this, "FabricEC2Client")
            .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.SMALL))
            .machineImage(AmazonLinuxImage())
            .userData(UserData.custom(userDataScript))
            .vpc(props.vpc)
            .vpcSubnets(SubnetSelection.builder().subnetType(SubnetType.PUBLIC).build())
            .securityGroup(securityGroup)
            .keyName(keyPair.keyName)
            .build()

        props.vpc.addInterfaceEndpoint(
            "FabricEC2NetworkEndpoint",
            InterfaceVpcEndpointOptions.builder()
                .service(InterfaceVpcEndpointService(props.fabric.network.vpcEndpointServiceName))
                .subnets(
                    SubnetSelection.builder()
                        .subnetFilters(listOf(SubnetFilter.byIds(listOf(client.instance.subnetId))))
                        .build()
                )
                .privateDnsEnabled(true)
                .build()
        )
    }
}
