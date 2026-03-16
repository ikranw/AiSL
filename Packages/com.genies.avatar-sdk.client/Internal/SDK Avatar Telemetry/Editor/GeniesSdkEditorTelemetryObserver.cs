#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using Genies.Sdk.Bootstrap.Editor;
using Genies.Telemetry;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Genies.Sdk.Avatar.Telemetry.Editor
{
    [InitializeOnLoad]
    internal static class GeniesSdkEditorTelemetryObserver
    {
        // Unity imports UPM samples to: Assets/Samples/<PACKAGE DISPLAY NAME>/<VERSION>/...
        // Display name folder is "Genies SDK Avatar".
        private const string ImportedSamplesRoot = "Assets/Samples/";
        private const string ImportedSamplesDisplayNameFolder = "Genies SDK Avatar";

        private static readonly string ImportedSamplesPrefix =
            $"{ImportedSamplesRoot}{ImportedSamplesDisplayNameFolder}/";

        private static bool _subscribed;

        // ------------------------------------------------------------
        // Telemetry consent (editor-only, asked once)
        // ------------------------------------------------------------
        private const string TelemetryConsentAskedKey =
            "Genies.Telemetry.Consent.Asked";

        static GeniesSdkEditorTelemetryObserver()
        {
            // Ask once, after editor UI is ready
            EditorApplication.delayCall -= EnsureTelemetryConsentPrompted;
            EditorApplication.delayCall += EnsureTelemetryConsentPrompted;

            EditorApplication.playModeStateChanged -= OnPlayModeStateChanged;
            EditorApplication.playModeStateChanged += OnPlayModeStateChanged;

            EnsureSubscribed(); // cover normal editor load + compile
        }

        private static void EnsureTelemetryConsentPrompted()
        {
            if (EditorPrefs.GetBool(TelemetryConsentAskedKey, false))
                return;

            EditorPrefs.SetBool(TelemetryConsentAskedKey, true);

            const string title = "Genies SDK Telemetry";
            const string message =
                "Genies gathers information about how you use the SDK (such as configuration and feature usage). " +
                "We collect this data to help us improve the SDK for future updates. " +
                "You can change this setting in \n\n" + "Project Settings → Genies → Telemetry Settings.";
            
            EditorUtility.DisplayDialog(title, message, "OK");

            // Enable telemetry by default (canonical gate lives in GeniesTelemetry)
            PlayerPrefs.SetInt(GeniesTelemetry.TelemetryEnabledKey, 1);
            PlayerPrefs.Save();
        }

        private static void OnPlayModeStateChanged(PlayModeStateChange state)
        {
            if (state == PlayModeStateChange.ExitingEditMode)
            {
                RecordPrereqSnapshot(reason: "play_pressed");
            }

            if (state == PlayModeStateChange.EnteredPlayMode)
            {
                EnsureSubscribed();
            }
        }

        private static void RecordPrereqSnapshot(string reason)
        {
            bool platformSupported = GeniesSdkPrerequisiteChecker.IsActivePlatformSupported();
            bool sdkInstalled = GeniesSdkPrerequisiteChecker.IsSdkInstalled();
            bool il2cpp = GeniesSdkPrerequisiteChecker.IsIL2CPPConfiguredForActivePlatform();
            bool net48 = GeniesSdkPrerequisiteChecker.IsNetFrameworkConfiguredForActivePlatform();
            bool vulkanWin = GeniesSdkPrerequisiteChecker.IsVulkanConfiguredForWindows();
            bool vulkanAndroid = GeniesSdkPrerequisiteChecker.IsVulkanConfiguredForAndroid();
            bool arm64Android = GeniesSdkPrerequisiteChecker.IsArm64ConfiguredForAndroid();
            bool minAndroidApi31 = GeniesSdkPrerequisiteChecker.IsMinAndroidApiLevelConfigured();
            bool inputHandling = GeniesSdkPrerequisiteChecker.IsActiveInputHandlingConfigured();
            bool tmpEssentials = GeniesSdkPrerequisiteChecker.IsTMPEssentialsImported();

            int metCount = 0;
            int unmetCount = 0;

            void Count(bool value)
            {
                if (value) metCount++;
                else unmetCount++;
            }

            Count(platformSupported);
            Count(sdkInstalled);
            Count(il2cpp);
            Count(net48);
            Count(vulkanWin);
            Count(vulkanAndroid);
            Count(arm64Android);
            Count(minAndroidApi31);
            Count(inputHandling);
            Count(tmpEssentials);

            bool allMet = unmetCount == 0;

            var properties = new Dictionary<string, object>
            {
                { "context", "Avatar SDK" },
                { "reason", reason },

                { "all_prerequisites_met", allMet },
                { "met_prerequisite_count", metCount },
                { "unmet_prerequisite_count", unmetCount },

                { "active_build_target", EditorUserBuildSettings.activeBuildTarget.ToString() },
                { "active_build_target_group", GeniesSdkPrerequisiteChecker.GetActiveBuildTargetGroup().ToString() },

                { "prereq_platform_supported", platformSupported },
                { "prereq_sdk_installed", sdkInstalled },
                { "prereq_il2cpp_active_platform", il2cpp },
                { "prereq_net_framework_4_8", net48 },
                { "prereq_vulkan_windows", vulkanWin },
                { "prereq_vulkan_android", vulkanAndroid },
                { "prereq_arm64_android", arm64Android },
                { "prereq_min_android_api_31", minAndroidApi31 },
                { "prereq_active_input_handling", inputHandling },
                { "prereq_tmp_essentials_imported", tmpEssentials },
            };

            GeniesTelemetry.RecordEvent(
                TelemetryEvent.Create(
                    name: allMet ? "dev_prereq_snapshot_met" : "dev_prereq_snapshot_not_met",
                    properties: properties
                )
            );
        }

        private static void EnsureSubscribed()
        {
            if (_subscribed)
                return;

            _subscribed = true;

            EditorSceneManager.sceneOpened -= OnSceneOpened;
            EditorSceneManager.sceneOpened += OnSceneOpened;

            GeniesSdkBootstrapWizard.CredentialsSet -= CredentialsSet;
            GeniesSdkBootstrapWizard.CredentialsSet += CredentialsSet;

            GeniesSdkBootstrapWizard.SdkConfiguredSuccessfully -= GeniesSdkBootstrapWizardOnSdkConfiguredSuccessfully;
            GeniesSdkBootstrapWizard.SdkConfiguredSuccessfully += GeniesSdkBootstrapWizardOnSdkConfiguredSuccessfully;

            GeniesSdkBootstrapWizard.SdkConfigurationFailed -= GeniesSdkBootstrapWizardOnSdkConfigurationFailed;
            GeniesSdkBootstrapWizard.SdkConfigurationFailed += GeniesSdkBootstrapWizardOnSdkConfigurationFailed;
        }

        private static void GeniesSdkBootstrapWizardOnSdkConfigurationFailed()
        {
            RecordPrereqSnapshot(reason: "wizard_closed_incomplete");

            GeniesTelemetry.RecordEvent(
                TelemetryEvent.Create(
                    name: "bootstrap_wizard_setup_incomplete",
                    properties: new Dictionary<string, object> { { "context", "Avatar SDK" } }
                )
            );
        }

        private static void GeniesSdkBootstrapWizardOnSdkConfiguredSuccessfully()
        {
            RecordPrereqSnapshot(reason: "wizard_completed");

            GeniesTelemetry.RecordEvent(
                TelemetryEvent.Create(
                    name: "boostrap_wizard_setup_successfully",
                    properties: new Dictionary<string, object> { { "context", "Avatar SDK" } }
                )
            );
        }

        private static void CredentialsSet()
        {
            GeniesTelemetry.RecordEvent(TelemetryEvent.Create("dev_credentials_set"));
        }

        private static void OnSceneOpened(Scene scene, OpenSceneMode mode)
        {
            var path = scene.path;
            if (!IsGeniesAvatarSampleScene(path))
                return;

            var properties = new Dictionary<string, object>
            {
                { "scene_name", scene.name },
                { "scene_path", path },
                { "source", "package_samples" },
            };

            GeniesTelemetry.RecordEvent(
                TelemetryEvent.Create(
                    name: "user_open_sample_scene",
                    properties: properties
                )
            );
        }

        private static bool IsGeniesAvatarSampleScene(string assetPath)
        {
            if (string.IsNullOrEmpty(assetPath))
                return false;

            if (!assetPath.EndsWith(".unity", StringComparison.OrdinalIgnoreCase))
                return false;

            // Imported samples (Assets/Samples/Genies SDK Avatar/<version>/...)
            if (assetPath.StartsWith(ImportedSamplesPrefix, StringComparison.OrdinalIgnoreCase))
                return true;

            return false;
        }

        private static bool IsGeniesAvatarSampleSceneAsset(string assetPath, out string source)
        {
            source = null;

            if (string.IsNullOrEmpty(assetPath))
                return false;

            if (!assetPath.EndsWith(".unity", StringComparison.OrdinalIgnoreCase))
                return false;

            if (assetPath.StartsWith(ImportedSamplesPrefix, StringComparison.OrdinalIgnoreCase))
            {
                source = "imported_samples";
                return true;
            }

            return false;
        }

        // Fires when samples are imported (assets copied into Assets/Samples/...)
        // This will catch .unity scenes appearing after sample import.
        private sealed class SampleImportPostprocessor : AssetPostprocessor
        {
            private const string ImportedSceneDedupKeyPrefix = "Genies.Sdk.Avatar.Telemetry.ImportedScene.";

            private static void OnPostprocessAllAssets(
                string[] importedAssets,
                string[] deletedAssets,
                string[] movedAssets,
                string[] movedFromAssetPaths)
            {
                if (importedAssets == null || importedAssets.Length == 0)
                    return;

                for (int i = 0; i < importedAssets.Length; i++)
                {
                    var path = importedAssets[i];
                    if (!IsGeniesAvatarSampleSceneAsset(path, out var source))
                        continue;

                    // Dedup per editor session (import can trigger multiple times)
                    string dedupKey = ImportedSceneDedupKeyPrefix + path;
                    if (SessionState.GetBool(dedupKey, false))
                        continue;

                    SessionState.SetBool(dedupKey, true);

                    var props = new Dictionary<string, object>
                    {
                        { "scene_path", path },
                        { "source", source },
                    };

                    GeniesTelemetry.RecordEvent(
                        TelemetryEvent.Create(
                            name: "user_import_sample_scene_asset",
                            properties: props
                        )
                    );
                }
            }
        }
    }
}
#endif
