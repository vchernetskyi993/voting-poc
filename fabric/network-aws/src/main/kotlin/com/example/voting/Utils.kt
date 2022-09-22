package com.example.voting

fun String.replace(vararg replacements: Pair<String, String>): String =
    replacements.fold(this) { acc, (l, r) -> acc.replace(l, r) }
