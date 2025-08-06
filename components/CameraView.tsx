import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  PhotoFile,
} from 'react-native-vision-camera';
import { labelImage } from '../utils/mlkit';

const { width } = Dimensions.get('window');

const options = ['Check Grammar', 'Suggest Article', 'Check Plurals', 'Translate', 'Check Gender'];

export default function CameraView() {
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [capturedPhoto, setCapturedPhoto] = useState<PhotoFile | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>(options[0]);

  useEffect(() => {
    requestPermission();
  }, []);

  const takePhoto = async () => {
    if (!camera.current) return;
    const photo = await camera.current.takePhoto({ flash: 'off' });
    setCapturedPhoto(photo);

    // Dummy - logic to be added
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
          <View style={styles.captureContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto} />
          </View>

          {/* Circular Options Slider (Dummy) */}
          <View style={styles.circularSlider}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionScroll}>
              {options.map((opt, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionBubble,
                    selectedOption === opt && styles.selectedBubble,
                  ]}
                  onPress={() => setSelectedOption(opt)}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </>
      ) : (
        <>
          <Image source={{ uri: 'file://' + capturedPhoto.path }} style={StyleSheet.absoluteFill} />
          
          {/* Labels Display */}
          <View style={styles.labelOverlay}>
            <Text style={styles.overlayTitle}>Detected Labels</Text>
            <ScrollView contentContainerStyle={styles.labelScroll}>
              {labels.map((label, index) => (
                <Text key={index} style={styles.labelText}>• {label}</Text>
              ))}
            </ScrollView>
          </View>

          {/* Retake Button */}
          <TouchableOpacity style={styles.retakeButton} onPress={reset}>
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>

          {/* Dummy Options Below Photo */}
          <View style={styles.resultOptionsBar}>
            {options.map((opt, index) => (
              <TouchableOpacity key={index} style={styles.resultOptionButton}>
                <Text style={styles.resultOptionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    zIndex: 2,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffffcc',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  circularSlider: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  optionScroll: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  optionBubble: {
    marginHorizontal: 6,
    backgroundColor: '#ffffff33',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#ffffff44',
  },
  selectedBubble: {
    backgroundColor: '#ffffffaa',
  },
  optionText: {
    color: '#fff',
    fontSize: 14,
  },
  labelOverlay: {
  position: 'absolute',
  top: 60,
  alignSelf: 'center',
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 30,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(10px)', // won't work in RN, just stylistic reference
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
  elevation: 8,
},
  overlayTitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '600',
  },
  labelScroll: {
    paddingBottom: 20,
  },
  labelText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  retakeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  retakeText: {
    color: '#fff',
    fontSize: 14,
  },
  resultOptionsBar: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  resultOptionButton: {
    backgroundColor: '#ffffff22',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  resultOptionText: {
    color: '#fff',
    fontSize: 12,
  },
});
