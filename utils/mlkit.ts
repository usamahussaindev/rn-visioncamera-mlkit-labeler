import ImageLabeling from '@react-native-ml-kit/image-labeling';

export async function labelImage(imagePath: string): Promise<string[]> {
  try {
    const results = await ImageLabeling.label(imagePath);

    if (!results || results.length === 0) {
      return ['No label found'];
    }

    // Get label with highest confidence
    const mostAccurate = results.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev
    );

    return [mostAccurate.text];
  } catch (err) {
    console.error('MLKit labeling failed:', err);
    return ['Labeling failed'];
  }
}
