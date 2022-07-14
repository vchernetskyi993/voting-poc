package com.example.gateway.config

import io.grpc.Channel
import io.grpc.ManagedChannel
import io.grpc.netty.shaded.io.grpc.netty.GrpcSslContexts
import io.grpc.netty.shaded.io.grpc.netty.NettyChannelBuilder
import org.hyperledger.fabric.client.Contract
import org.hyperledger.fabric.client.Gateway
import org.hyperledger.fabric.client.identity.Identities
import org.hyperledger.fabric.client.identity.Signers
import org.hyperledger.fabric.client.identity.X509Identity
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.security.cert.X509Certificate
import kotlin.io.path.Path
import kotlin.io.path.bufferedReader

@Configuration
class FabricConfig(
    private val props: FabricProperties,
) {
    @Bean
    fun electionsContract(gateway: Gateway): Contract =
        gateway.getNetwork(props.channel).getContract(props.contract)

    @Bean
    fun gateway(channel: Channel): Gateway =
        Gateway.newInstance()
            .identity(X509Identity(props.msp, readCert(props.client.certPath)))
            .signer(
                Signers.newPrivateKeySigner(
                    Identities.readPrivateKey(
                        Path(props.client.keyPath).bufferedReader()
                    )
                )
            )
            .connection(channel)
            .connect()

    @Bean(destroyMethod = "shutdown")
    fun channel(): ManagedChannel =
        NettyChannelBuilder.forTarget(props.peer.address)
            .sslContext(
                GrpcSslContexts.forClient()
                    .trustManager(readCert(props.peer.certPath))
                    .build()
            )
            .build()

    private fun readCert(path: String): X509Certificate =
        Identities.readX509Certificate(Path(path).bufferedReader())
}