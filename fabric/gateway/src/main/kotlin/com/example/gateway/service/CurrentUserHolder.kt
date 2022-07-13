package com.example.gateway.service

import com.example.gateway.model.UserDetailsImpl
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

@Component
class CurrentUserHolder {
    val user
        get() = SecurityContextHolder.getContext()
            .authentication
            .principal as UserDetailsImpl
}