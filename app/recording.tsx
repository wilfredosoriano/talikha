import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '../constants/colors';
import Waveform from '../components/Waveform';
import { transcribeAudio, processTranscript } from '../lib/groq';
import { insertCapture } from '../lib/database';
import { useCaptureStore } from '../store/useCaptureStore';
import { useSettingsStore } from '../store/useSettingsStore';
import type { Capture } from '../lib/database';

export default function RecordingScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const addCapture = useCaptureStore((s) => s.addCapture);
  const language = useSettingsStore((s) => s.language);
  const nickname = useSettingsStore((s) => s.nickname);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [elapsed, setElapsed] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'transcribing' | 'analyzing'>('transcribing');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    startRecording();
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function startRecording() {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Microphone access is required to record voice notes. Please enable it in your device settings.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function handleStop() {
    if (timerRef.current) clearInterval(timerRef.current);

    await recorder.stop();
    const uri = recorder.uri;

    setProcessing(true);
    const now = new Date();

    setProcessingStep('transcribing');
    let transcript = uri ? await transcribeAudio(uri) : '';
    if (!transcript) transcript = `Voice note recorded at ${now.toLocaleTimeString()}`;

    setProcessingStep('analyzing');
    const processed = await processTranscript(transcript, language, nickname);

    const newCapture: Capture = {
      id: Date.now().toString(),
      transcript,
      title: processed.title,
      category: processed.category,
      summary: processed.summary,
      tags: processed.tags,
      createdAt: now.toISOString(),
      completed: false,
    };

    addCapture(newCapture);
    await insertCapture(db, newCapture);

    setProcessing(false);
    router.replace(`/detail/${newCapture.id}`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topSection}>
        <Text style={styles.listeningText}>Listening...</Text>
        <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
      </View>

      <View style={styles.waveformSection}>
        <Waveform />
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.stopButton} onPress={handleStop} activeOpacity={0.8}>
          <View style={styles.stopIcon} />
        </TouchableOpacity>
        <Text style={styles.stopLabel}>Tap to stop recording</Text>
      </View>

      {processing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={Colors.primaryBrown} />
          <Text style={styles.processingText}>
            {processingStep === 'transcribing' ? 'Transcribing audio...' : 'Analyzing your note...'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 10,
  },
  listeningText: {
    fontSize: 16,
    color: Colors.bodyText,
    fontWeight: '500',
  },
  timer: {
    fontSize: 22,
    color: Colors.tan,
    fontWeight: '300',
    letterSpacing: 1,
  },
  waveformSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 56,
    gap: 14,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.card,
    borderWidth: 3,
    borderColor: Colors.primaryBrown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: Colors.primaryBrown,
  },
  stopLabel: {
    fontSize: 12,
    color: Colors.tan,
    fontWeight: '400',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(250,243,232,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  processingText: {
    fontSize: 15,
    color: Colors.bodyText,
    fontWeight: '500',
  },
});
