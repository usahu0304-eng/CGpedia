package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp

private val CgDarkColorScheme = darkColorScheme(
    primary = CgNavyPrimaryDark,
    onPrimary = CgOnNavyPrimaryDark,
    primaryContainer = CgNavyContainerDark,
    onPrimaryContainer = CgOnNavyContainerDark,
    secondary = CgCobaltSecondaryDark,
    onSecondary = CgOnCobaltSecondaryDark,
    secondaryContainer = CgCobaltContainerDark,
    onSecondaryContainer = CgOnCobaltContainerDark,
    tertiary = CgTealTertiaryDark,
    onTertiary = CgOnTealTertiaryDark,
    tertiaryContainer = CgTealContainerDark,
    onTertiaryContainer = CgOnTealContainerDark,
    background = CgBackgroundDark,
    onBackground = CgOnBackgroundDark,
    surface = CgSurfaceDark,
    onSurface = CgOnSurfaceDark,
    surfaceVariant = CgSurfaceVariantDark,
    onSurfaceVariant = CgOnSurfaceVariantDark,
    outline = CgOutlineDark,
    error = CgErrorDark,
    onError = CgOnErrorDark,
    errorContainer = CgErrorContainerDark,
    onErrorContainer = CgOnErrorContainerDark
)

private val CgLightColorScheme = lightColorScheme(
    primary = CgNavyPrimaryLight,
    onPrimary = CgOnNavyPrimaryLight,
    primaryContainer = CgNavyContainerLight,
    onPrimaryContainer = CgOnNavyContainerLight,
    secondary = CgCobaltSecondaryLight,
    onSecondary = CgOnCobaltSecondaryLight,
    secondaryContainer = CgCobaltContainerLight,
    onSecondaryContainer = CgOnCobaltContainerLight,
    tertiary = CgTealTertiaryLight,
    onTertiary = CgOnTealTertiaryLight,
    tertiaryContainer = CgTealContainerLight,
    onTertiaryContainer = CgOnTealContainerLight,
    background = CgBackgroundLight,
    onBackground = CgOnBackgroundLight,
    surface = CgSurfaceLight,
    onSurface = CgOnSurfaceLight,
    surfaceVariant = CgSurfaceVariantLight,
    onSurfaceVariant = CgOnSurfaceVariantLight,
    outline = CgOutlineLight,
    error = CgErrorLight,
    onError = CgOnErrorLight,
    errorContainer = CgErrorContainerLight,
    onErrorContainer = CgOnErrorContainerLight
)

val CgShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(22.dp),
    extraLarge = RoundedCornerShape(28.dp)
)

@Composable
fun CGpediaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    // Strictly disable wallpaper dynamic colors so system orange wallpapers can NEVER inject orange tones
    val colorScheme = if (darkTheme) CgDarkColorScheme else CgLightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = CgShapes,
        content = content
    )
}
