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
import software.amazon.awscdk.services.iam.Role
import software.amazon.awscdk.services.iam.ServicePrincipal
import software.amazon.awscdk.services.s3.IBucket
import software.amazon.awscdk.services.secretsmanager.Secret
import software.constructs.Construct
import java.net.URL

data class FabricClientProps(
    val vpc: IVpc,
    val network: HyperledgerFabricNetwork,
    val env: Environment,
    val bucket: IBucket,
)

fun buildFabricClient(
    scope: Construct,
    props: FabricClientProps,
): Instance = createEc2(Construct(scope, "FabricClient"), props)

private fun createEc2(scope: Construct, props: FabricClientProps): Instance {
    val adminPassword = Secret.Builder.create(scope, "GovAdminPassword").build()

    return Instance.Builder.create(scope, "FabricEC2Client")
        .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.SMALL))
        .machineImage(AmazonLinuxImage())
        .userData(UserData.custom(prepareUserDataScript(props, adminPassword)))
        .vpc(props.vpc)
        .vpcSubnets(SubnetSelection.builder().subnetType(SubnetType.PUBLIC).build())
        .securityGroup(createSecurityGroup(scope, props.vpc))
        .keyName(createKeyPair(scope).keyName)
        .role(createRole(scope, props.network, props.bucket, adminPassword))
        .build()
}

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

private fun prepareUserDataScript(props: FabricClientProps, adminPassword: Secret) =
    readResource("client-data.sh")
        .replace(
            "{{MEMBER_ID}}" to props.network.memberId,
            "{{ORDERING_SERVICE_ENDPOINT}}" to props.network.ordererEndpoint,
            "{{PEER_NODE_ENDPOINT}}" to props.network.nodes[0].endpoint,
            "{{FABRIC_CA_ENDPOINT}}" to props.network.caEndpoint,
            "{{TLS_CERT_URL}}" to
                    "https://s3.%s.amazonaws.com/%s.managedblockchain/etc/managedblockchain-tls-chain.pem"
                        .format(props.env.region, props.env.region),
            "{{SU_PASSWORD_ARN}}" to props.network.adminPasswordSecret.secretArn,
            "{{ADMIN_PASSWORD_ARN}}" to adminPassword.secretArn,
            "{{AWS_REGION}}" to props.env.region!!,
            "{{NETWORK_DATA_BUCKET}}" to props.bucket.bucketName,
        )

private fun createRole(
    scope: Construct,
    network: HyperledgerFabricNetwork,
    bucket: IBucket,
    adminPassword: Secret,
): Role {
    val role = Role.Builder.create(scope, "FabricEC2ClientRole")
        .assumedBy(ServicePrincipal("ec2.amazonaws.com"))
        .build()

    bucket.grantRead(role)
    network.adminPasswordSecret.grantRead(role)
    adminPassword.grantRead(role)

    return role
}

