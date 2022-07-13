package com.example.gateway.model

import java.math.BigInteger

data class Page<T>(
    val pageNumber: BigInteger,
    val pageSize: Int,
    val values: List<T>,
    val elementsCount: BigInteger,
    val pageCount: BigInteger,
)
