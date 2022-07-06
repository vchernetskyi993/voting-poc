import java.net.URI

plugins {
    kotlin("jvm") version "1.7.0"
    kotlin("plugin.serialization") version "1.7.0"
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
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.3.3")
}
