package com.example.security

import com.google.firebase.auth.FirebaseUser

object AdminConfig {
    // Exclusive Owner Admin email from runtime identity — no public Admin sign-up exists
    const val OWNER_ADMIN_EMAIL = "usahu0304@gmail.com"

    fun isVerifiedOwnerAdmin(user: FirebaseUser?, isInTrustedAdminRegistry: Boolean = false): Boolean {
        if (user == null) return false
        val matchesOwnerEmail = user.email?.equals(OWNER_ADMIN_EMAIL, ignoreCase = true) == true &&
            user.isEmailVerified
        return matchesOwnerEmail || isInTrustedAdminRegistry
    }
}
