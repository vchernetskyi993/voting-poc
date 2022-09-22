package com.example.voting

import software.constructs.Construct
import software.amazon.awscdk.Stack
import software.amazon.awscdk.StackProps
import software.amazon.awscdk.services.ec2.Vpc


class ElectionsAwsStack(
    scope: Construct,
    id: String,
    props: StackProps,
) : Stack(scope, id, props) {
    init {
        val fabricVpc = createVpc()

        val network = FabricNetwork(this, "FabricNetwork") {
            vpc = fabricVpc
        }

        FabricClient(this, "FabricClient") {
            vpc = fabricVpc
            fabric = network
            env = props.env ?: throw IllegalArgumentException("Environment param is required")
        }
    }

    private fun createVpc(): Vpc =
        Vpc.Builder.create(this, "ElectionVpc")
            .cidr("10.0.0.0/16")
            .build()
}
