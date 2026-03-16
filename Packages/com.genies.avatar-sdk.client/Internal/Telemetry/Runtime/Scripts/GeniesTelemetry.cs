using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Genies.Login.Native;
using Newtonsoft.Json;
using UnityEngine;

namespace Genies.Telemetry
{
    /// <summary>
    /// Unity-side telemetry bridge.
    /// Buffers events on disk until native telemetry is ready, then flushes them.
    /// </summary>
    internal static class GeniesTelemetry
    {
        // ------------------------------------------------------------
        // Config / limits
        // ------------------------------------------------------------

        // PlayerPrefs is used only for the user opt-in flag
        public const string TelemetryEnabledKey = "Genies.Telemetry.Enabled";

        // Max number of pre-auth events persisted on disk
        private const int MaxPending = 10;

        // Stored under Application.persistentDataPath
        private const string PendingEventsFileName = "genies-sdk.data";

#if UNITY_IOS && !UNITY_EDITOR
        private const string DllName = "__Internal";
#else
        private const string DllName = "GeniesTelemetryBridge";
#endif

        // ------------------------------------------------------------
        // Background worker
        // ------------------------------------------------------------

        // Events waiting to be sent to native
        private static readonly ConcurrentQueue<TelemetryEvent> _sendQueue = new();

        private static CancellationTokenSource _workerCts = new();
        private static Task _workerTask;

        // ------------------------------------------------------------
        // Shutdown coordination
        // ------------------------------------------------------------

        private static readonly object _shutdownLock = new();
        private static Task _shutdownTask;

        // When true, avoid calling into native and buffer instead
        private static volatile bool _isShuttingDown;

        // ------------------------------------------------------------
        // Persistence coordination
        // ------------------------------------------------------------

        // Guards all pending-events file IO
        private static readonly object _pendingEventsFileLock = new();

        // ------------------------------------------------------------
        // Static init
        // ------------------------------------------------------------

        static GeniesTelemetry()
        {
#if !UNITY_EDITOR
            return;
#endif
            _workerCts?.Cancel();
            _workerCts = new CancellationTokenSource();
            _workerTask = Task.Run(WorkerLoop, _workerCts.Token);

            // Flush buffered events once native has access to auth tokens
            GeniesLoginSdk.UserLoggedIn -= FlushOnLogin;
            GeniesLoginSdk.UserLoggedIn += FlushOnLogin;
        }

        private static async void FlushOnLogin()
        {
            try
            {
                await Task.Yield();
                FlushToNative();
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"GeniesTelemetry: login flush error: {ex.Message}");
            }
        }
        private static async Task WorkerLoop()
        {
            var ct = _workerCts.Token;

            while (!ct.IsCancellationRequested)
            {
                try
                {
                    if (_sendQueue.TryDequeue(out var telemetryEvent))
                    {
                        EnqueueEventJson(BuildEventJson(telemetryEvent));
                    }
                    else
                    {
                        await Task.Delay(1000, ct);
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Debug.LogError($"GeniesTelemetry worker error: {ex.Message}");
                }
            }
        }

        // ------------------------------------------------------------
        // Native bridge
        // ------------------------------------------------------------

        [DllImport(DllName, EntryPoint = "Initialize_TelemetryClient",
            CallingConvention = CallingConvention.Cdecl)]
        internal static extern void Initialize(
            string baseUrl,
            string appName,
            string clientId,
            string sdkVersion,
            string platform,
            string unityVersion,
            int maxBatchSize,
            int flushIntervalMs);

        [DllImport(DllName, EntryPoint = "Shutdown_TelemetryClient",
            CallingConvention = CallingConvention.Cdecl)]
        internal static extern void Shutdown();

        [DllImport(DllName, EntryPoint = "Telemetry_IsInitialized",
            CallingConvention = CallingConvention.Cdecl)]
        [return: MarshalAs(UnmanagedType.I1)]
        internal static extern bool IsInitialized();

        [DllImport(DllName, EntryPoint = "Telemetry_CanTelemetryBeSent",
            CallingConvention = CallingConvention.Cdecl)]
        [return: MarshalAs(UnmanagedType.I1)]
        internal static extern bool CanTelemetryBeSent();

        [DllImport(DllName, EntryPoint = "Telemetry_EnqueueEventJson",
            CallingConvention = CallingConvention.Cdecl)]
        internal static extern void EnqueueEventJson(string eventJson);

        [DllImport(DllName, EntryPoint = "Telemetry_UpdateConfig",
            CallingConvention = CallingConvention.Cdecl)]
        internal static extern void UpdateConfig(
            string baseUrl,
            string appName,
            string clientId,
            string sdkVersion,
            string platform,
            string unityVersion,
            int maxBatchSize,
            int flushIntervalMs);

        // ------------------------------------------------------------
        // Shutdown
        // ------------------------------------------------------------
        /// <summary>
        /// Shuts down telemetry. Please only call this if you really are done with it...
        /// </summary>
        /// <returns></returns>
        internal static Task ShutdownAsync()
        {
            lock (_shutdownLock)
            {
                if (_shutdownTask != null && !_shutdownTask.IsCompleted)
                {
                    return _shutdownTask;
                }

                _isShuttingDown = true;

                _shutdownTask = Task.Run(() =>
                {
                    try
                    {
                        _workerCts.Cancel();
                        _workerTask?.Wait(500);
                    }
                    catch {}
                    try
                    {
                        Shutdown();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"GeniesTelemetry: shutdown error: {ex.Message}");
                    }
                    finally
                    {
                        _isShuttingDown = false;
                    }
                });

                return _shutdownTask;
            }
        }

        // ------------------------------------------------------------
        // Public API
        // ------------------------------------------------------------

        internal static void RecordEvent(string eventName)
        {
            RecordEvent(TelemetryEvent.Create(eventName));
        }

        internal static void RecordEvent(TelemetryEvent evt)
        {
#if !UNITY_EDITOR
            return;
#endif
            if (evt == null)
            {
                return;
            }

            if (PlayerPrefs.GetInt(TelemetryEnabledKey, 0) == 0)
            {
                return;
            }

            if (_isShuttingDown)
            {
                RecordPreAuthEvent(evt);
                return;
            }

            try
            {
                if (IsInitialized() && CanTelemetryBeSent())
                {
                    _sendQueue.Enqueue(evt);
                    return;
                }
            }
            catch
            {
                // Fall through to buffering
            }

            RecordPreAuthEvent(evt);
        }

        internal static void RecordPreAuthEvent(TelemetryEvent evt)
        {
            if (evt == null)
            {
                return;
            }

            lock (_pendingEventsFileLock)
            {
                var envelope = LoadEnvelopeInternal();

                envelope.events.Add(evt);
                if (envelope.events.Count > MaxPending)
                {
                    envelope.events.RemoveRange(
                        0,
                        envelope.events.Count - MaxPending);
                }

                SaveEnvelopeInternal(envelope);
            }
        }

        internal static void FlushToNative()
        {
            if (_isShuttingDown || !IsInitialized() || !CanTelemetryBeSent())
            {
                return;
            }

            List<TelemetryEvent> eventsToSend;

            lock (_pendingEventsFileLock)
            {
                var envelope = LoadEnvelopeInternal();
                if (envelope.events.Count == 0)
                {
                    return;
                }

                eventsToSend = new List<TelemetryEvent>(envelope.events);
                DeleteEnvelopeFileInternal();
            }

            foreach (var evt in eventsToSend)
            {
                _sendQueue.Enqueue(evt);
            }
        }

        internal static void ClearStoredEvents()
        {
            lock (_pendingEventsFileLock)
            {
                DeleteEnvelopeFileInternal();
            }
        }

        // ------------------------------------------------------------
        // File persistence
        // ------------------------------------------------------------

        private static string PendingEventsFilePath =>
            Path.Combine(Application.persistentDataPath, PendingEventsFileName);

        private static PendingTelemetryEnvelope LoadEnvelopeInternal()
        {
            try
            {
                if (!File.Exists(PendingEventsFilePath))
                {
                    return new PendingTelemetryEnvelope();
                }

                string json = File.ReadAllText(PendingEventsFilePath, Encoding.UTF8);
                if (string.IsNullOrWhiteSpace(json))
                {
                    return new PendingTelemetryEnvelope();
                }

                return JsonConvert.DeserializeObject<PendingTelemetryEnvelope>(json)
                       ?? new PendingTelemetryEnvelope();
            }
            catch
            {
                return new PendingTelemetryEnvelope();
            }
        }

        private static void SaveEnvelopeInternal(PendingTelemetryEnvelope env)
        {
            try
            {
                string finalPath = PendingEventsFilePath;
                string tempPath  = finalPath + ".tmp";

                File.WriteAllText(tempPath, JsonConvert.SerializeObject(env), Encoding.UTF8);

                if (File.Exists(finalPath))
                {
                    File.Delete(finalPath);
                }

                File.Move(tempPath, finalPath);
            }
            catch
            {
                // Best-effort persistence
            }
        }

        private static void DeleteEnvelopeFileInternal()
        {
            try
            {
                if (File.Exists(PendingEventsFilePath))
                {
                    File.Delete(PendingEventsFilePath);
                }
            }
            catch
            {
            }
        }

        // ------------------------------------------------------------
        // JSON builder (worker-safe)
        // ------------------------------------------------------------

        private static string BuildEventJson(TelemetryEvent evt)
        {
            return JsonConvert.SerializeObject(new
            {
                name = evt.Name,
                timestamp = evt.Timestamp,
                id = string.IsNullOrEmpty(evt.Id) ? null : evt.Id,
                properties = evt.Properties ?? new Dictionary<string, object>()
            });
        }
    }
}
