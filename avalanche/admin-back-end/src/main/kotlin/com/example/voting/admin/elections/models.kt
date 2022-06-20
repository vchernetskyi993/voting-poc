package com.example.voting.admin.elections

import com.google.protobuf.ByteString
import voting.ElectionsOuterClass
import voting.uint256
import java.math.BigInteger

data class NewElection(
    val start: Int,
    val end: Int,
    val title: String,
    val description: String,
    val candidates: List<String>,
)

fun NewElection.toProto(): ElectionsOuterClass.NewElection =
    ElectionsOuterClass.NewElection.newBuilder()
        .setStart(start)
        .setEnd(end).setTitle(title).setDescription(description)
        .addAllCandidates(candidates)
        .build()

data class ElectionId(
    val id: BigInteger,
)

data class Election(
    val id: BigInteger,
    val start: Int,
    val end: Int,
    val title: String,
    val description: String,
    val candidates: List<Candidate>,
)

data class Candidate(
    val name: String,
    val votes: BigInteger,
)

fun ElectionsOuterClass.Election.toJson(): Election = Election(
    id = id.toBigInteger(),
    start = start,
    end = end,
    title = title,
    description = description,
    candidates = candidatesList.map { it.toJson() },
)

fun ElectionsOuterClass.Candidate.toJson(): Candidate = Candidate(
    name = name,
    votes = votes.toBigInteger(),
)

fun ElectionsOuterClass.uint256.toBigInteger() = BigInteger(1, data.toByteArray())

fun BigInteger.toUint256() = uint256 { data = ByteString.copyFrom(toByteArray()) }
