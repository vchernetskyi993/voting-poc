package com.example.voting.admin.elections

import com.google.protobuf.ByteString
import voting.ElectionsOuterClass
import voting.uint256
import java.math.BigInteger
import java.nio.ByteBuffer

fun Int.toUint256(): ElectionsOuterClass.uint256 {
    val v = this
    return uint256 {
        data = ByteString.copyFrom(
            ByteBuffer.allocate(Int.SIZE_BYTES).putInt(v).array()
        )
    }
}

fun ElectionsOuterClass.uint256.toInt() = BigInteger(1, data.toByteArray()).toInt()
