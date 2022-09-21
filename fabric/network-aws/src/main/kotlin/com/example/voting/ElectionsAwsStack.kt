package com.example.voting

import software.amazon.awscdk.Duration
import software.constructs.Construct
import software.amazon.awscdk.Stack
import software.amazon.awscdk.services.sqs.Queue


class ElectionsAwsStack(scope: Construct, id: String) : Stack(scope, id) {
    init {
        Queue.Builder.create(this, "NetworkAwsQueue")
            .visibilityTimeout(Duration.seconds(300))
            .build()
    }
}
