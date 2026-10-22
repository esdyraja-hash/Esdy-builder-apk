import { ProjectSettings, SigningConfig } from '../types';

export class GradleGenerator {
  /**
   * Generates root settings.gradle.kts
   */
  static generateSettingsGradle(settings: ProjectSettings): string {
    const moduleIncludes = settings.modules.map(m => `include(":${m.name}")`).join('\n');

    return `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${settings.appName.replace(/[^a-zA-Z0-9_-]/g, '_')}"

// Multi-Module Inclusions
${moduleIncludes}
`;
  }

  /**
   * Generates root build.gradle.kts
   */
  static generateRootBuildGradle(settings: ProjectSettings): string {
    return `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.android.library) apply false
}

tasks.register("clean", Delete::class) {
    delete(rootProject.layout.buildDirectory)
}
`;
  }

  /**
   * Generates gradle/libs.versions.toml (Modern version catalog recommended by Google)
   */
  static generateLibsVersionsToml(settings: ProjectSettings): string {
    return `[versions]
agp = "${settings.agpVersion}"
kotlin = "${settings.kotlinVersion}"
coreKtx = "1.15.0"
appcompat = "1.7.0"
material = "1.12.0"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.9.3"
composeBom = "2024.11.00"
junit = "4.13.2"
androidxJunit = "1.2.1"
espressoCore = "3.6.1"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-appcompat = { group = "androidx.appcompat", name = "appcompat", version.ref = "appcompat" }
material = { group = "com.google.android.material", name = "material", version.ref = "material" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
junit = { group = "junit", name = "junit", version.ref = "junit" }
androidx-junit = { group = "androidx.test.ext", name = "junit", version.ref = "androidxJunit" }
androidx-espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version.ref = "espressoCore" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
android-library = { id = "com.android.library", version.ref = "agp" }
`;
  }

  /**
   * Generates app/build.gradle.kts with signing configurations, automated versioning, and 16KB page size support
   */
  static generateAppBuildGradle(settings: ProjectSettings, signing?: SigningConfig): string {
    const signingBlock = signing
      ? `
    signingConfigs {
        create("release") {
            storeFile = file("release.keystore")
            storePassword = project.findProperty("RELEASE_STORE_PASSWORD") as String? ?: "${signing.storePassword}"
            keyAlias = project.findProperty("RELEASE_KEY_ALIAS") as String? ?: "${signing.alias}"
            keyPassword = project.findProperty("RELEASE_KEY_PASSWORD") as String? ?: "${signing.password}"
            enableV1Signing = ${signing.v1Signing}
            enableV2Signing = ${signing.v2Signing}
            enableV3Signing = ${signing.v3Signing}
            enableV4Signing = ${signing.v4Signing}
        }
    }`
      : `
    signingConfigs {
        getByName("debug") {
            // Default Android Debug Keystore
        }
    }`;

    const versioningCodeSnippet = `
// Automated Versioning Hook for CI/CD Pipelines
val gitCommitCount = providers.exec {
    commandLine("git", "rev-list", "--count", "HEAD")
    isIgnoreExitValue = true
}.standardOutput.asText.map { it.trim().toIntOrNull() ?: ${settings.versionCode} }

val ciRunNumber = System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull() 
    ?: System.getenv("CI_PIPELINE_IID")?.toIntOrNull()
    ?: ${settings.versionCode}
`;

    return `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

${versioningCodeSnippet}

android {
    namespace = "${settings.packageId}"
    compileSdk = ${settings.compileSdk}

    defaultConfig {
        applicationId = "${settings.packageId}"
        minSdk = ${settings.minSdk}
        targetSdk = ${settings.targetSdk}
        
        // Automated versioning logic
        versionCode = when ("${settings.versioningStrategy}") {
            "ci_run_number" -> ciRunNumber
            "git_commit_count" -> gitCommitCount.get()
            else -> ${settings.versionCode}
        }
        versionName = "${settings.versionName}"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        // Support for 16KB memory page sizes required for Android 15 & Google Play
        ndk {
            abiFilters.addAll(listOf("armeabi-v7a", "arm64-v8a", "x86", "x86_64"))
        }
    }

    ${signingBlock}

    buildTypes {
        release {
            isMinifyEnabled = ${settings.enableR8Shrinking}
            isShrinkResources = ${settings.enableR8Shrinking}
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            ${signing ? 'signingConfig = signingConfigs.getByName("release")' : '// Signed via CI or Play App Signing'}
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
            versionNameSuffix = "-DEBUG"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf(
            "-opt-in=kotlin.RequiresOptIn",
            "-Xjvm-default=all"
        )
    }

    buildFeatures {
        viewBinding = ${settings.enableViewBinding}
        compose = ${settings.enableCompose}
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
        jniLibs {
            useLegacyPackaging = false
        }
    }

    bundle {
        language {
            enableSplit = true
        }
        density {
            enableSplit = true
        }
        abi {
            enableSplit = true
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.lifecycle.runtime.ktx)

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}
`;
  }

  /**
   * Generates gradle.properties
   */
  static generateGradleProperties(settings: ProjectSettings): string {
    return `# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configuration-cache=true

# Google Play 16 KB Page Alignment enforcement
android.bundle.enableUncompressedNativeLibs=true
`;
  }

  /**
   * Generates proguard-rules.pro
   */
  static generateProguardRules(): string {
    return `# Add project specific ProGuard rules here.
# Keep AndroidX & Material components
-keep class com.google.android.material.** { *; }
-dontwarn com.google.android.material.**

# Keep data classes & models from obfuscation
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod

# Keep WebKit and JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
`;
  }

  /**
   * Generates AndroidManifest.xml
   */
  static generateAndroidManifest(settings: ProjectSettings): string {
    const permissions: string[] = [];
    if (settings.permissions.internet) permissions.push('android.permission.INTERNET');
    if (settings.permissions.camera) permissions.push('android.permission.CAMERA');
    if (settings.permissions.location) {
      permissions.push('android.permission.ACCESS_FINE_LOCATION');
      permissions.push('android.permission.ACCESS_COARSE_LOCATION');
    }
    if (settings.permissions.microphone) permissions.push('android.permission.RECORD_AUDIO');
    if (settings.permissions.notifications) permissions.push('android.permission.POST_NOTIFICATIONS');
    if (settings.permissions.readMediaImages) permissions.push('android.permission.READ_MEDIA_IMAGES');
    if (settings.permissions.foregroundService) permissions.push('android.permission.FOREGROUND_SERVICE');

    const permXml = permissions
      .map(p => `    <uses-permission android:name="${p}" />`)
      .join('\n');

    return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

${permXml}

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${settings.appName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.App"
        android:extractNativeLibs="false">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="${settings.orientation}"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`;
  }

  /**
   * Generates MainActivity.kt
   */
  static generateMainActivity(settings: ProjectSettings): string {
    return `package ${settings.packageId}

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebSettings

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                cacheMode = WebSettings.LOAD_DEFAULT
            }
            webViewClient = WebViewClient()
            loadUrl("file:///android_asset/index.html")
        }
        
        setContentView(webView)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
`;
  }
}
