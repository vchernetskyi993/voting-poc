import java.net.URI

val junitVersion: String by project
val logbackVersion: String by project

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

    implementation("org.slf4j:slf4j-api:1.7.36")
    implementation("ch.qos.logback:logback-core:$logbackVersion")
    runtimeOnly("ch.qos.logback:logback-classic:$logbackVersion")

    testImplementation("org.junit.jupiter:junit-jupiter-api:$junitVersion")
    testImplementation("org.junit.jupiter:junit-jupiter-params:$junitVersion")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:$junitVersion")
    testImplementation("io.mockk:mockk:1.12.4")
    testImplementation("io.kotest:kotest-assertions-core:5.3.2")
}

tasks.test {
    useJUnitPlatform()
}
