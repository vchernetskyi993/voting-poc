package com.example.gateway.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding

@ConstructorBinding
@ConfigurationProperties("app.fabric")
data class FabricProperties(
    val msp: String,
    val channel: String,
    val contract: String,
    val peer: PeerProperties,
    val client: ClientProperties,
) {
    data class PeerProperties(
        val address: String,
        val certPath: String,
    )

    data class ClientProperties(
        val certPath: String,
        val keyPath: String,
    )
}
