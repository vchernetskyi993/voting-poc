package com.example.voting.admin.model

import java.math.BigInteger

data class Page<T>(
    val pageNumber: Int,
    val pageSize: Int,
    val values: List<T>,
    val elementsCount: BigInteger,
    val pageCount: BigInteger,
)
