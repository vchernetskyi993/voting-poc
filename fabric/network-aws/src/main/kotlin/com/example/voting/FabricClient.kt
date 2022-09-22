package com.example.voting

import software.amazon.awscdk.Environment
import software.amazon.awscdk.services.ec2.AmazonLinuxImage
import software.amazon.awscdk.services.ec2.CfnKeyPair
import software.amazon.awscdk.services.ec2.IVpc
import software.amazon.awscdk.services.ec2.Instance
import software.amazon.awscdk.services.ec2.InstanceClass
import software.amazon.awscdk.services.ec2.InstanceSize
import software.amazon.awscdk.services.ec2.InstanceType
import software.amazon.awscdk.services.ec2.UserData
import software.constructs.Construct
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

        Instance.Builder.create(this, "FabricEC2Client")
            .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.SMALL))
            .machineImage(AmazonLinuxImage())
            .userData(UserData.custom(userDataScript))
            .vpc(props.vpc)
            .keyName(keyPair.keyName)
            .build()
    }
}
