import TextRecognizer from '@react-native-ml-kit/text-recognition';

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return Response.json({ error: 'No image URL provided' }, { status: 400 });
    }

    const result = await TextRecognizer.recognize(imageUrl);

    if (!result || !result.text) {
      return Response.json({ error: 'No text found in image' }, { status: 400 });
    }

    return Response.json({
      success: true,
      text: result.text,
    });
  } catch (error: any) {
    console.error('Text extraction error:', error);
    return Response.json(
      { error: error.message || 'Failed to extract text' },
      { status: 500 }
    );
  }
} 