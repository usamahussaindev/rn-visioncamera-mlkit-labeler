import axios from 'axios';

export async function translateToGerman(text: string): Promise<string> {
  try {
    if (!text || text.trim() === '') {
      console.warn('Empty text input for translation');
      return 'Invalid input';
    }

    console.log('Text to translate:', text);

    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: text,
        langpair: 'en|de',
      },
      timeout: 10000,
    });

    console.log('MyMemory response:', JSON.stringify(response.data, null, 2));

    const translated = response.data?.responseData?.translatedText;

    if (translated) {
      return translated;
    } else {
      return 'No translation found';
    }
  } catch (error: any) {
    console.error('Translation failed:', error?.message || error);
    return 'Translation failed';
  }
}
