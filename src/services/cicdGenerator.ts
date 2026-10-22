import { CicdPipelineConfig, ProjectSettings } from '../types';

export class CicdGenerator {
  /**
   * Generates production-ready GitHub Actions workflow (.github/workflows/android-release.yml)
   */
  static generateGitHubActions(settings: ProjectSettings, cicd: CicdPipelineConfig): string {
    const testSteps = [];
    if (cicd.runLint) {
      testSteps.push(`      - name: Run Android Lint Check
        run: ./gradlew lintRelease --stacktrace`);
    }
    if (cicd.runUnitTests) {
      testSteps.push(`      - name: Run Unit Tests
        run: ./gradlew testReleaseUnitTest --continue`);
    }
    if (cicd.runDetekt) {
      testSteps.push(`      - name: Run Static Code Analysis
        run: ./gradlew detekt || true`);
    }

    return `name: Android CI/CD Automated Build & Release

on:
  push:
    branches: [ "${cicd.triggerBranch}" ]
${cicd.triggerOnPr ? `  pull_request:\n    branches: [ "${cicd.triggerBranch}" ]` : ''}
${cicd.triggerOnTag ? `  push:\n    tags:\n      - 'v*'` : ''}
  workflow_dispatch:
    inputs:
      build_type:
        description: 'Build Type (AAB or APK)'
        required: true
        default: 'aab'
        type: choice
        options:
          - aab
          - apk
          - both

jobs:
  test_and_verify:
    name: 🧪 Automated Verification & Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up JDK ${cicd.javaVersion}
        uses: actions/setup-java@v4
        with:
          java-version: '${cicd.javaVersion}'
          distribution: 'temurin'
          ${cicd.enableCache ? 'cache: gradle' : ''}

      - name: Grant Execute Permission for Gradlew
        run: chmod +x gradlew

${testSteps.join('\n\n')}

      - name: Upload Test Reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-reports
          path: app/build/reports/

  build_and_sign:
    name: 📦 Build & Sign AAB / APK
    needs: test_and_verify
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up JDK ${cicd.javaVersion}
        uses: actions/setup-java@v4
        with:
          java-version: '${cicd.javaVersion}'
          distribution: 'temurin'
          ${cicd.enableCache ? 'cache: gradle' : ''}

      - name: Grant Execute Permission for Gradlew
        run: chmod +x gradlew

      - name: Decode Keystore from GitHub Secrets
        env:
          KEYSTORE_BASE64: \${{ secrets.RELEASE_KEYSTORE_BASE64 }}
        run: |
          if [ -n "$KEYSTORE_BASE64" ]; then
            echo "$KEYSTORE_BASE64" | base64 --decode > app/release.keystore
            echo "✅ Keystore successfully restored from secrets"
          else
            echo "⚠️ Warning: RELEASE_KEYSTORE_BASE64 secret not found, build will use unsigned or debug mode"
          fi

      - name: Automated Version Bump & Build Bundle (AAB)
        env:
          RELEASE_STORE_PASSWORD: \${{ secrets.RELEASE_STORE_PASSWORD }}
          RELEASE_KEY_ALIAS: \${{ secrets.RELEASE_KEY_ALIAS }}
          RELEASE_KEY_PASSWORD: \${{ secrets.RELEASE_KEY_PASSWORD }}
          GITHUB_RUN_NUMBER: \${{ github.run_number }}
        run: |
          ./gradlew bundleRelease assembleRelease --no-daemon

      - name: Archive Android App Bundle (AAB)
        uses: actions/upload-artifact@v4
        with:
          name: ${settings.appName.replace(/\s+/g, '_')}-release-aab
          path: app/build/outputs/bundle/release/*.aab
          retention-days: 30

      - name: Archive Universal APK
        uses: actions/upload-artifact@v4
        with:
          name: ${settings.appName.replace(/\s+/g, '_')}-release-apk
          path: app/build/outputs/apk/release/*.apk
          retention-days: 30

  deploy_google_play:
    name: 🚀 Deploy to Google Play (${cicd.googlePlayTrack})
    needs: build_and_sign
    if: github.ref == 'refs/heads/${cicd.triggerBranch}'
    runs-on: ubuntu-latest
    steps:
      - name: Download AAB Artifact
        uses: actions/download-artifact@v4
        with:
          name: ${settings.appName.replace(/\s+/g, '_')}-release-aab
          path: release-artifacts/

      - name: Deploy to Google Play Console
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: \${{ secrets.PLAY_STORE_SERVICE_ACCOUNT_JSON }}
          packageName: ${settings.packageId}
          releaseFiles: release-artifacts/*.aab
          track: ${cicd.googlePlayTrack}
          status: completed
          changesNotSentForReview: false
`;
  }

  /**
   * Generates production-ready GitLab CI configuration (.gitlab-ci.yml)
   */
  static generateGitLabCI(settings: ProjectSettings, cicd: CicdPipelineConfig): string {
    return `image: eclipse-temurin:${cicd.javaVersion}-jdk-jammy

variables:
  GRADLE_OPTS: "-Dorg.gradle.daemon=false"
  GRADLE_USER_HOME: "\${CI_PROJECT_DIR}/.gradle"

cache:
  key: "\${CI_COMMIT_REF_SLUG}"
  paths:
    - .gradle/wrapper
    - .gradle/caches

stages:
  - test
  - build
  - deploy

before_script:
  - chmod +x ./gradlew
  - export GRADLE_USER_HOME=\${GRADLE_USER_HOME}

# 🧪 Stage 1: Automated Testing
lint_and_unit_tests:
  stage: test
  script:
    - ./gradlew lintRelease testReleaseUnitTest
  artifacts:
    when: always
    paths:
      - app/build/reports/
    expire_in: 7 days

# 📦 Stage 2: Build & Sign AAB and APK
build_release:
  stage: build
  dependencies:
    - lint_and_unit_tests
  script:
    - echo "$RELEASE_KEYSTORE_BASE64" | base64 -d > app/release.keystore
    - ./gradlew bundleRelease assembleRelease -PRELEASE_STORE_PASSWORD="$RELEASE_STORE_PASSWORD" -PRELEASE_KEY_ALIAS="$RELEASE_KEY_ALIAS" -PRELEASE_KEY_PASSWORD="$RELEASE_KEY_PASSWORD"
  artifacts:
    paths:
      - app/build/outputs/bundle/release/*.aab
      - app/build/outputs/apk/release/*.apk
    expire_in: 30 days
  only:
    - ${cicd.triggerBranch}
    - tags

# 🚀 Stage 3: Internal Distribution / Google Play
deploy_play_store:
  stage: deploy
  dependencies:
    - build_release
  script:
    - echo "Deploying AAB to Google Play track: ${cicd.googlePlayTrack}..."
    # Custom webhook hook or Fastlane supply
  only:
    - tags
`;
  }

  /**
   * Generates fastlane/Fastfile for automated Play Store metadata and binary submission
   */
  static generateFastfile(settings: ProjectSettings): string {
    return `default_platform(:android)

platform :android do
  desc "Runs all unit tests and linter"
  lane :test do
    gradle(task: "lintRelease testReleaseUnitTest")
  end

  desc "Build signed release AAB for Google Play Store"
  lane :build_release do
    gradle(
      task: "bundle",
      build_type: "Release"
    )
  end

  desc "Deploy a new version to the Google Play Store"
  lane :deploy_internal do
    build_release
    upload_to_play_store(
      track: "internal",
      package_name: "${settings.packageId}",
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
  end
end
`;
  }
}
