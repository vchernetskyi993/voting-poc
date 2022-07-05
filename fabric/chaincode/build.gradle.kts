import java.net.URI

plugins {
    kotlin("jvm") version "1.7.0"
    id("com.github.johnrengelman.shadow") version "7.1.2"
    application
}

repositories {
    mavenCentral()
    maven {
        url = URI("https://jitpack.io")
    }
}

application {
    mainClass.set("org.hyperledger.fabric.contract.ContractRouter")
}

dependencies {
    implementation("org.hyperledger.fabric-chaincode-java:fabric-chaincode-shim:2.4.1")
}
