package com.example.elections

import org.hyperledger.fabric.contract.Context
import java.math.BigInteger

private const val COUNT_KEY = "electionsCount"

fun Context.electionsCount(): BigInteger = getBigIntState(COUNT_KEY)

fun Context.incrementElectionsCount() =
    stub.putStringState(COUNT_KEY, electionsCount().inc().toString())

fun Context.saveElection(id: BigInteger, election: Election) =
    stub.putStringState(id.toString(), election.toJsonString())

fun Context.fetchElection(id: BigInteger): Election =
    stub.getStringState(id.toString()).toJsonEntity()

fun Context.votesCount(electionId: BigInteger, candidateId: Int): BigInteger =
    getBigIntState(candidateKey(electionId, candidateId))

fun Context.incrementVotesCount(electionId: BigInteger, candidateId: Int) {
    val key = candidateKey(electionId, candidateId)
    val state = getBigIntState(key)
    stub.putStringState(key, state.inc().toString())
}

fun Context.canVote(electionId: BigInteger, voterId: BigInteger): Boolean =
    stub.getStringState(voterKey(electionId, voterId)).isNullOrEmpty()

fun Context.setVoted(electionId: BigInteger, voterId: BigInteger) =
    stub.putStringState(voterKey(electionId, voterId), "1")

private fun candidateKey(electionId: BigInteger, candidateId: Int) = "$electionId:c$candidateId"
private fun voterKey(electionId: BigInteger, voterId: BigInteger) = "$electionId:v$voterId"

private fun Context.getBigIntState(key: String): BigInteger {
    val state = stub.getStringState(key)
    val count = when {
        state.isNullOrEmpty() -> "0"
        else -> state
    }
    return count.toBigInteger()
}

