package com.example.voting

import kotlin.io.path.Path
import kotlin.io.path.readText

fun String.replace(vararg replacements: Pair<String, String>): String =
    replacements.fold(this) { acc, (l, r) -> acc.replace(l, r) }

fun readResource(file: String): String =
    Path(System.getProperty("user.dir"), "resources", file).readText()
