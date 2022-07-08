package com.example.elections

import kotlinx.serialization.KSerializer
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encodeToString
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.Json
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.contextual
import org.hyperledger.fabric.shim.ChaincodeException
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import java.math.BigInteger

val logger: Logger = LoggerFactory.getLogger(Contract::class.java)

fun <T> handleExceptions(action: () -> T): T {
    try {
        return action()
    } catch (e: Exception) {
        logger.error(e.message, e)
        throw when (e) {
            is ChaincodeException -> e
            else -> ChaincodeException(e.message, e)
        }
    }
}

fun expect(message: String, pred: () -> Boolean) {
    if (!pred()) {
        throw ChaincodeException(message)
    }
}

val json = Json {
    serializersModule = SerializersModule {
        contextual(BigIntSerializer)
    }
}

inline fun <reified T> T.toJsonString() = json.encodeToString(this)

inline fun <reified T> String.toJsonEntity(): T = json.decodeFromString(this)

object BigIntSerializer : KSerializer<BigInteger> {
    override val descriptor: SerialDescriptor =
        PrimitiveSerialDescriptor("BigInteger", PrimitiveKind.STRING)

    override fun deserialize(decoder: Decoder) =
        decoder.decodeString().toBigInteger()

    override fun serialize(encoder: Encoder, value: BigInteger) =
        encoder.encodeString(value.toString())
}
