export async function translateToChinese(text: string): Promise<string> {
  if (!text || text.trim() === "") {
    return "";
  }

  // Limit text length for translation API
  const maxLength = 500;
  const textToTranslate = text.length > maxLength ? text.substring(0, maxLength) : text;

  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|zh`
    );
    const data: any = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }

    // Fallback: return original text if translation fails
    console.warn(`Translation failed for: "${text.substring(0, 50)}..."`);
    return text;
  } catch (error) {
    console.warn(`Translation error for: "${text.substring(0, 50)}...":`, error);
    return text;
  }
}

export async function translateBatch(texts: string[]): Promise<string[]> {
  // Translate in batches to avoid rate limits
  const batchSize = 5;
  const results: string[] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(translateToChinese));
    results.push(...batchResults);

    // Small delay between batches
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}
