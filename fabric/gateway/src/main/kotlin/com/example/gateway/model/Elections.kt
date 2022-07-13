package com.example.gateway.model

import java.math.BigInteger

data class Election(
    val start: Int,
    val end: Int,
    val title: String,
    val description: String,
    val candidates: List<String>,
)

data class ElectionWithResults(
    val data: Election,
    val results: Map<Int, BigInteger>,
    val canVote: Boolean,
)
