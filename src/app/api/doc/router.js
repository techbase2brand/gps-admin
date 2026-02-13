import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const s3Url = searchParams.get('url');

  if (!s3Url) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  try {
    // 1. Fetch the PDF directly from S3
    const response = await axios.get(s3Url, {
      responseType: 'arraybuffer',
    });

    // 2. Return the file data back to the user
    return new Response(response.data, {
      headers: {
        'Content-Type': 'application/pdf',
        // 'inline' shows it in browser, 'attachment' downloads it
        'Content-Disposition': 'inline; filename="invoice.pdf"',
      },
    });
  } catch (error) {
    console.error("Proxy Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch file from S3" }, { status: 500 });
  }
}