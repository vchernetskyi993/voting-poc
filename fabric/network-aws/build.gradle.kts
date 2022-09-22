plugins {
    kotlin("jvm") version "1.7.10"
    application
}

repositories {
    mavenCentral()
}

application {
    mainClass.set("com.example.voting.ElectionsAwsAppKt")
}

group = "com.myorg"
version = "0.1"
description = "network-aws"

dependencies {
    implementation("software.amazon.awscdk:aws-cdk-lib:2.42.1")
    implementation("software.constructs:constructs:[10.0.0,11.0.0)")
    implementation("io.github.cdklabs:cdk-hyperledger-fabric-network:0.8.49")

    testImplementation("org.junit.jupiter:junit-jupiter:5.7.1")
}
