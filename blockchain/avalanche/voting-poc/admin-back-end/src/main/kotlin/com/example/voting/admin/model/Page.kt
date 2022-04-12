package com.example.voting.admin.model

data class Page<T>(
    val pageNumber: Int,
    val pageSize: Int,
    val values: List<T>,
    val elementsCount: Int,
    val pageCount: Int,
)
