import ImageLabeling from '@react-native-ml-kit/image-labeling';
import { translateToGerman } from './translate';

export async function labelImage(imagePath: string): Promise<string[]> {
  try {
    const results = await ImageLabeling.label(imagePath);

    if (!results || results.length === 0) {
      return ['No label found'];
    }

    const mostAccurate = results.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev
    );

    const translated = await translateToGerman(mostAccurate.text);

    return [mostAccurate.text, translated];
  } catch (err) {
    console.error('MLKit labeling failed:', err);
    return ['Labeling failed'];
  }
}
