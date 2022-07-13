package com.example.gateway.model

import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.User

data class UserDetailsImpl(
    val id: Long,
    private val username: String,
    private val password: String,
) : User(username, password, listOf(SimpleGrantedAuthority("USER"))) {
    override fun getUsername() = username

    override fun getPassword() = password
}
