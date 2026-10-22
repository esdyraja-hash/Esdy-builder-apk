import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  Cpu, 
  Store, 
  KeyRound, 
  Layers, 
  FileCode,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const DocumentationTab: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState('target_sdk_35');
  const [searchQuery, setSearchQuery] = useState('');

  const topics = [
    {
      id: 'target_sdk_35',
      title: 'Target SDK 35 & 16 KB Page Alignment',
      category: 'Android 15 & Play Store',
      icon: Cpu,
      summary: 'Google Play August 2025 requirement for Android 15 & 16 KB memory page sizes.',
      content: `## Target SDK 35 (Android 15) & 16 KB Page Alignment

### 1. Mandatory Target SDK 35 Enforcement
Beginning in August 2025, Google Play requires all new apps and updates to target Android 15 (API level 35). This ensures apps take advantage of modern security, battery optimizations, and privacy safeguards.

### 2. The 16 KB Page Size Mandate
Starting with Android 15 on devices like Pixel 9 and modern ARM64 silicon, Android supports a 16 KB memory page size (up from the traditional 4 KB).
- **Why it matters**: 16 KB page alignment delivers 5-10% overall system performance gains and faster app launch times.
- **The Risk**: Apps packaging native C/C++ shared libraries (\`.so\`) compiled with 4 KB alignment will crash immediately on 16 KB devices.

### 3. Gradle Configuration for 16 KB Support
In your \`app/build.gradle.kts\`:
\`\`\`kotlin
android {
    defaultConfig {
        ndk {
            abiFilters.addAll(listOf("armeabi-v7a", "arm64-v8a", "x86", "x86_64"))
        }
    }
    packaging {
        jniLibs {
            useLegacyPackaging = false
        }
    }
}
\`\`\`

If compiling native C++ code in CMake or ndk-build, pass the linker flag:
\`\`\`cmake
target_link_options(your_native_lib PRIVATE "-Wl,-z,max-page-size=16384")
\`\`\`

Verify alignment using standard Android NDK tools:
\`\`\`bash
readelf -l libyour_native_lib.so | grep LOAD
\`\`\`
Look for \`Align 0x4000\` (16384 bytes).
`,
    },
    {
      id: 'play_store_checklist',
      title: 'Google Play Store Submission Checklist',
      category: 'Store Guidelines',
      icon: Store,
      summary: 'Step-by-step checklist to pass review on first submission without rejections.',
      content: `## Google Play Store Submission Master Checklist

### Stage 1: Build Artifact Prerequisites
- [x] **Format**: Android App Bundle (\`.aab\`) format only (APK is deprecated for initial publishing).
- [x] **Signing**: Signed with your release upload key. Google Play App Signing handles user delivery.
- [x] **SDK Level**: \`compileSdk = 35\` and \`targetSdk = 35\`.
- [x] **64-bit Architecture**: Include \`arm64-v8a\` and \`x86_64\` native libraries.

### Stage 2: Policy & Compliance Declarations
- [x] **Privacy Policy**: Active public HTTPS URL. Must explicitly declare what user data is gathered (e.g. IP address, device identifiers).
- [x] **Account Deletion Portal**: If users can register an account in the app, you MUST provide a web URL where they can request deletion of account and all associated data.
- [x] **Data Safety Form**: Accurately declare all data collected, whether it is encrypted in transit (TLS/HTTPS), and if data is shared with 3rd parties.
- [x] **Sensitive Permissions**: Provide justification videos or text if requesting Location, Camera, or SMS permissions.

### Stage 3: Store Listing Optimization
- **Title**: Maximum 30 characters. Do not use spam words like "Best", "Free", or "#1".
- **Short Description**: Maximum 80 characters.
- **Full Description**: Maximum 4000 characters.
- **Graphics**: 
  - Hi-res icon: 512 x 512 PNG (32-bit color).
  - Feature graphic: 1024 x 500 PNG/JPEG.
  - Screenshots: At least 2 phone screenshots (minimum 1080p).
`,
    },
    {
      id: 'signing_security',
      title: 'Keystore Signing & CI/CD Security',
      category: 'Security & Automation',
      icon: KeyRound,
      summary: 'Securely manage release keys and inject them via GitHub/GitLab secrets.',
      content: `## Cryptographic Signing & CI/CD Secret Management

### 1. Keystore Security Rules
- **Never commit your Keystore file (\`.jks\` or \`.keystore\`) to git!** Add \`*.keystore\` and \`*.jks\` to \`.gitignore\`.
- Always store the Keystore base64 string and passwords in GitHub Repository Secrets.

### 2. Exporting Keystore to Base64
In terminal:
\`\`\`bash
base64 -w 0 release.keystore > keystore_base64.txt
\`\`\`
Copy the contents into GitHub Secrets as \`RELEASE_KEYSTORE_BASE64\`.

### 3. Restoring Keystore in CI Pipeline
In your GitHub Actions workflow:
\`\`\`yaml
- name: Decode Keystore
  run: |
    echo "\${{ secrets.RELEASE_KEYSTORE_BASE64 }}" | base64 --decode > app/release.keystore
\`\`\`

### 4. Signature Schemes Overview
- **v1 (JAR signing)**: Signs individual ZIP entries.
- **v2 (APK Signature Scheme v2)**: Protects full file integrity against tampering.
- **v3 (Key Rotation)**: Allows rotating compromised signing keys without breaking updates.
- **v4 (Streaming Install)**: Generates \`.apk.idsig\` files for fast incremental installs.
`,
    },
    {
      id: 'multi_module_gradle',
      title: 'Multi-Module Architecture & Kotlin DSL',
      category: 'Gradle & Architecture',
      icon: Layers,
      summary: 'Designing modular apps with :core:network, :core:model, and :feature:ui.',
      content: `## Multi-Module Android Architecture & Gradle Kotlin DSL

### 1. Why Multi-Module?
- **Faster Builds**: Gradle caches unchanged modules and compiles independent modules in parallel.
- **Code Encapsulation**: Internal implementation details are hidden with \`internal\` visibility.
- **Dynamic Feature Modules**: Modules can be downloaded on-demand from Google Play.

### 2. Common Architecture Blueprint
\`\`\`
:app                     (Root orchestrator, themes, navigation graph)
├── :core:model          (Pure Kotlin data classes & entities)
├── :core:network        (Retrofit/Ktor API clients & serialization)
├── :core:database       (Room DB & offline caching)
├── :feature:dashboard   (Main user screen & ViewModels)
└── :feature:settings    (Preferences & account controls)
\`\`\`

### 3. Version Catalog (\`gradle/libs.versions.toml\`)
Centrally manages dependency versions across all modules without duplicate hardcoded strings:
\`\`\`toml
[versions]
kotlin = "2.0.21"
agp = "8.7.2"

[libraries]
androidx-core = { group = "androidx.core", name = "core-ktx", version = "1.15.0" }

[plugins]
android-app = { id = "com.android.application", version.ref = "agp" }
\`\`\`
`,
    },
    {
      id: 'r8_optimization',
      title: 'R8 Shrinking, Obfuscation & ProGuard',
      category: 'Performance',
      icon: ShieldCheck,
      summary: 'Optimizing bytecode size and obfuscating reverse-engineered source.',
      content: `## R8 Code Shrinking & ProGuard Optimization

### 1. Activating R8
In \`app/build.gradle.kts\`:
\`\`\`kotlin
buildTypes {
    release {
        isMinifyEnabled = true
        isShrinkResources = true
        proguardFiles(
            getDefaultProguardFile("proguard-android-optimize.txt"),
            "proguard-rules.pro"
        )
    }
}
\`\`\`

### 2. ProGuard Keep Rules for Reflection & JavaScript
When using WebViews with JavaScript bridges or JSON serialization:
\`\`\`proguard
# Keep JavaScript Interface methods from obfuscation
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Data classes for JSON parsing (Moshi/Gson/KotlinX)
-keepattributes Signature
-keepattributes *Annotation*
-keepclassmembers class com.esdy.app.core.model.** { *; }
\`\`\`
`,
    },
  ];

  const filteredTopics = topics.filter((t) => {
    if (!searchQuery) return true;
    return (
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const activeTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2">
          <BookOpen className="w-4 h-4" />
          <span>Local Developer Guides &amp; Offline Documentation</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
          Android Engineering &amp; Store Policy Reference
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Comprehensive offline technical documentation covering Gradle 8.10, Android 15 Target SDK 35, 16 KB page alignment, R8 shrinking, and Google Play Store review policies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Topic Navigation & Search */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search offline guides…"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="space-y-2">
            {filteredTopics.map((topic) => {
              const Icon = topic.icon;
              const isSelected = selectedTopicId === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    isSelected ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-0.5">
                      {topic.category}
                    </div>
                    <div className="font-bold text-xs truncate">
                      {topic.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {topic.summary}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 self-center shrink-0 ${isSelected ? 'text-cyan-500' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Markdown Reader View */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[560px]">
            <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
              {activeTopic.content.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('## ')) {
                  return (
                    <h2 key={index} className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                      {paragraph.replace('## ', '')}
                    </h2>
                  );
                }
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={index} className="text-sm font-bold text-cyan-700 dark:text-cyan-400 mt-4 mb-1">
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                }
                if (paragraph.startsWith('```')) {
                  const lines = paragraph.split('\n');
                  const code = lines.slice(1, -1).join('\n');
                  return (
                    <pre key={index} className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto my-3 border border-slate-800">
                      <code>{code}</code>
                    </pre>
                  );
                }
                if (paragraph.startsWith('- ')) {
                  const items = paragraph.split('\n').filter(Boolean);
                  return (
                    <ul key={index} className="list-disc pl-5 space-y-1 my-2 text-slate-700 dark:text-slate-300">
                      {items.map((item, i) => (
                        <li key={i}>{item.replace(/^-\s*/, '')}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={index} className="text-slate-700 dark:text-slate-300 my-2">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
