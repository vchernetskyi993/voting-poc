import com.google.protobuf.gradle.*
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

val grpcVersion: String by project
val grpcKotlinVersion: String by project
val protobufVersion: String by project

plugins {
	id("org.springframework.boot") version "2.6.6"
	id("io.spring.dependency-management") version "1.0.11.RELEASE"
	kotlin("jvm") version "1.6.10"
	kotlin("plugin.spring") version "1.6.10"
	kotlin("plugin.serialization") version "1.6.10"
	id("com.google.protobuf") version "0.8.18"
}

group = "com.example.voting"
version = "0.0.1-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_11

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-webflux")
	implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.3.2")
	implementation("io.projectreactor.kotlin:reactor-kotlin-extensions")
	implementation("org.jetbrains.kotlin:kotlin-reflect")
	implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor")

	implementation("io.grpc:grpc-protobuf:$grpcVersion")
	implementation("io.grpc:grpc-stub:$grpcVersion")
	implementation("io.grpc:grpc-core:$grpcVersion")
	implementation("com.google.protobuf:protobuf-kotlin:$protobufVersion")
	implementation("io.grpc:grpc-kotlin-stub:$grpcKotlinVersion")
	implementation("net.devh:grpc-client-spring-boot-starter:2.13.1.RELEASE")

	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("io.projectreactor:reactor-test")
	testImplementation("net.devh:grpc-server-spring-boot-starter:2.13.1.RELEASE")
	testImplementation("io.grpc:grpc-testing:$grpcVersion")
}

tasks.withType<KotlinCompile> {
	kotlinOptions {
		freeCompilerArgs = listOf("-Xjsr305=strict")
		jvmTarget = "11"
	}
}

tasks.withType<Test> {
	useJUnitPlatform()
}

sourceSets {
	main {
		proto {
			srcDir("../contracts-gateway/src/proto")
		}
	}
}

protobuf {
	protoc {
		artifact = "com.google.protobuf:protoc:$protobufVersion"
	}
	plugins {
		id("grpc") {
			artifact = "io.grpc:protoc-gen-grpc-java:$grpcVersion"
		}
		id("grpckt") {
			artifact = "io.grpc:protoc-gen-grpc-kotlin:$grpcKotlinVersion:jdk7@jar"
		}
	}
	generateProtoTasks {
		all().forEach {
			it.plugins {
				id("grpc")
				id("grpckt")
			}
			it.builtins {
				id("kotlin")
			}
		}
	}
}

// needed only for Intellij to recognize generated sources; shouldn't be required
sourceSets {
	main {
		java {
			srcDirs(
				"build/generated/source/proto/main/grpc",
				"build/generated/source/proto/main/grpckt",
				"build/generated/source/proto/main/java",
				"build/generated/source/proto/main/kotlin",
			)
		}
	}
}
