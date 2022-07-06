package com.example.elections

import org.hyperledger.fabric.contract.Context
import java.math.BigInteger

fun Context.electionsCount(): BigInteger =
    stub.getStringState("electionsCount").toBigInteger()
