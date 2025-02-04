import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const { base64 } = await request.json();

    if (!base64) {
      return Response.json({ error: 'No image data provided' }, { status: 400 });
    }

    // Upload to Cloudinary using base64 data
    const uploadResponse = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64}`,
      {
        folder: 'pure-scans',
      }
    );

    return Response.json({
      success: true,
      secure_url: uploadResponse.secure_url,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return Response.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
} 