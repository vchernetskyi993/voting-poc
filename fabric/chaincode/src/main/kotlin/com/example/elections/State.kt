package com.example.elections

import org.hyperledger.fabric.contract.Context
import java.math.BigInteger

private const val COUNT_KEY = "electionsCount"

fun Context.electionsCount(): BigInteger {
    val state = stub.getStringState(COUNT_KEY)
    val count = when {
        state.isNullOrEmpty() -> "0"
        else -> state
    }
    return count.toBigInteger()
}

fun Context.incrementElectionsCount() =
    stub.putStringState(COUNT_KEY, electionsCount().inc().toString())

fun Context.saveElection(id: String, election: Election) =
    stub.putStringState(id, election.toJsonString())

fun Context.fetchElection(id: String): ElectionWithResults =
    ElectionWithResults(
        stub.getStringState(id).toJsonEntity(),
    )
