package com.example.elections

import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.Json
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.contextual
import org.hyperledger.fabric.shim.ChaincodeException
import java.math.BigInteger

fun <T> handleExceptions(action: () -> T): T {
    try {
        return action()
    } catch (e: Exception) {
        throw when (e) {
            is ChaincodeException -> e
            else -> ChaincodeException(e.message, e)
        }
    }
}

val json = Json {
    serializersModule = SerializersModule {
        contextual(BigIntSerializer)
    }
}

object BigIntSerializer : KSerializer<BigInteger> {
    override val descriptor: SerialDescriptor =
        PrimitiveSerialDescriptor("BigInteger", PrimitiveKind.STRING)

    override fun deserialize(decoder: Decoder) =
        decoder.decodeString().toBigInteger()

    override fun serialize(encoder: Encoder, value: BigInteger) =
        encoder.encodeString(value.toString())
}
