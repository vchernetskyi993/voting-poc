package com.example.elections

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import java.math.BigInteger

@Serializable
data class Election(
    @Contextual
    val id: BigInteger,
    val value: String,
)

@Serializable
data class ElectionWithResults(
    val data: Election
)

@Serializable
data class Vote(
    @Contextual
    val electionId: BigInteger,
    val candidateId: Int,
    @Contextual
    val voterId: BigInteger,
)
