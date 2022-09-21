package com.example.voting

import software.amazon.awscdk.App

fun main() {
    val app = App()
    ElectionsAwsStack(app, "ElectionsAwsStack")
    app.synth()
}
