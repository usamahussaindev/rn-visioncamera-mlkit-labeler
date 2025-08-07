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
import PhotoManipulator from 'react-native-photo-manipulator';
import { labelImage } from '../utils/mlkit';
import { translateToGerman } from '../utils/translate';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const options = ['Focus Object', 'Suggest Article', 'Check Plurals', 'Translate', 'Check Gender'];

export default function CameraView() {
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [capturedPhoto, setCapturedPhoto] = useState<PhotoFile | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [translatedLabel, setTranslatedLabel] = useState('');
  const [showGerman, setShowGerman] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');

  const [focusRect, setFocusRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [manualFocusMode, setManualFocusMode] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  //  Focus mode activation/deactivation based on option selected
  useEffect(() => {
    if (selectedOption !== 'Focus Object') {
      setManualFocusMode(false);
      setFocusRect(null);
      setStartPoint(null);
    } else {
      setManualFocusMode(true);
    }
  }, [selectedOption]);

  const takePhoto = async () => {
    if (!camera.current) return;
    const photo = await camera.current.takePhoto({ flash: 'off' });
    setCapturedPhoto(photo);

    const labelResults = await labelImage('file://' + photo.path);
    setLabels(labelResults);
  };

  const handleToggleTranslation = async () => {
    if (!showGerman && labels.length > 0) {
      const translated = await translateToGerman(labels[0]);
      setTranslatedLabel(translated);
      setShowGerman(true);
    } else {
      setShowGerman(false);
    }
  };

  const handleCancel = () => {
    setCapturedPhoto(null);
    setLabels([]);
    setTranslatedLabel('');
    setShowGerman(false);
    setFocusRect(null);
    setStartPoint(null);
    setManualFocusMode(false);
    setSelectedOption('');
  };

  const handleFocusScan = async () => {
    if (!capturedPhoto || !focusRect) return;

    const cropRegion = {
      x: Math.max(Math.floor(focusRect.x), 0),
      y: Math.max(Math.floor(focusRect.y), 0),
      width: Math.floor(focusRect.width),
      height: Math.floor(focusRect.height),
    };

    try {
      const croppedPath = await PhotoManipulator.crop(
        'file://' + capturedPhoto.path,
        cropRegion
      );

      const croppedLabels = await labelImage(croppedPath);
      setLabels(croppedLabels);
      setManualFocusMode(false);
    } catch (err) {
      console.error('Crop or label error:', err);
    }
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
        </>
      ) : (
        <>
          <View
            style={StyleSheet.absoluteFill}
            onStartShouldSetResponder={() => selectedOption === 'Focus Object'}
            onResponderGrant={(e) => {
              if (selectedOption !== 'Focus Object') return;
              const { locationX, locationY } = e.nativeEvent;
              setStartPoint({ x: locationX, y: locationY });
              setManualFocusMode(true);
            }}
            onResponderMove={(e) => {
              if (!startPoint || selectedOption !== 'Focus Object') return;
              const { locationX, locationY } = e.nativeEvent;
              setFocusRect({
                x: startPoint.x,
                y: startPoint.y,
                width: locationX - startPoint.x,
                height: locationY - startPoint.y,
              });
            }}
          >
            <Image source={{ uri: 'file://' + capturedPhoto.path }} style={StyleSheet.absoluteFill} />
            {focusRect && (
              <View
                style={{
                  position: 'absolute',
                  left: focusRect.x,
                  top: focusRect.y,
                  width: focusRect.width,
                  height: focusRect.height,
                  borderWidth: 2,
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }}
              />
            )}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>×</Text>
          </TouchableOpacity>

          {/* Labels + Translation (only if not in focus mode) */}
          {!manualFocusMode && (
            <View style={styles.labelConnectorContainer}>
              <TouchableOpacity style={styles.startButton} onPress={handleToggleTranslation}>
                <Text style={styles.startButtonText}>
                  {showGerman ? 'English' : 'Check German'}
                </Text>
              </TouchableOpacity>
              <View style={styles.dot} />
              <View style={styles.line} />
              <View style={styles.labelBox}>
                <Text style={styles.labelBoxText}>
                  {showGerman
                    ? `Translated: ${translatedLabel || '...'}`
                    : labels.length > 0
                    ? labels[0]
                    : 'Labeling...'}
                </Text>
              </View>
            </View>
          )}

          {/* Scan Area Button */}
          {focusRect && selectedOption === 'Focus Object' && (
            <TouchableOpacity style={styles.scanButton} onPress={handleFocusScan}>
              <Text style={styles.scanButtonText}>Scan Area</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Option Slider */}
      <View style={styles.circularSlider}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.optionScroll}
        >
          {options.map((opt, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionBubble,
                selectedOption === opt && styles.selectedBubble,
              ]}
              onPress={() => {
                if (opt === 'Focus Object') {
                  setSelectedOption(selectedOption === 'Focus Object' ? '' : 'Focus Object');
                } else {
                  setSelectedOption(opt);
                }
              }}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
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
  cancelButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 32,
    height: 32,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  labelConnectorContainer: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    elevation: 6,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  line: {
    width: 2,
    height: 30,
    backgroundColor: '#fff',
  },
  labelBox: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  labelBoxText: {
    color: '#fff',
    fontSize: 14,
  },
  scanButton: {
    position: 'absolute',
    bottom: 160,
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  scanButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
});
