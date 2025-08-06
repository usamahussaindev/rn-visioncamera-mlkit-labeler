import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, PhotoFile } from 'react-native-vision-camera';
import { labelImage } from '../utils/mlkit';

export default function CameraView() {
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [capturedPhoto, setCapturedPhoto] = useState<PhotoFile | null>(null);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    requestPermission();
  }, []);

  const takePhoto = async () => {
    if (!camera.current) return;
    const photo = await camera.current.takePhoto({ flash: 'off' });
    setCapturedPhoto(photo);

    const labelResults = await labelImage('file://' + photo.path);
    setLabels(labelResults);
  };

  const reset = () => {
    setCapturedPhoto(null);
    setLabels([]);
  };

  if (!device || !hasPermission) {
    return <Text style={styles.message}>Waiting for camera permission...</Text>;
  }

  return (
    <View style={styles.container}>
      {!capturedPhoto ? (
        <>
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            photo={true}
          />
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <Text style={styles.buttonText}>Capture</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Image source={{ uri: 'file://' + capturedPhoto.path }} style={styles.preview} />
          <ScrollView style={styles.labelsBox}>
            {labels.map((label, index) => (
              <Text key={index} style={styles.labelText}>• {label}</Text>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.captureButton} onPress={reset}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  message: { color: '#fff', textAlign: 'center', marginTop: 50 },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#1e90ff',
    padding: 16,
    borderRadius: 10,
  },
  buttonText: { color: '#fff', fontSize: 16 },
  preview: { flex: 1 },
  labelsBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    maxHeight: 150,
  },
  labelText: { color: '#fff', fontSize: 16 },
});
