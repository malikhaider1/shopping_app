import api from './api';

interface UploadResponse {
    success: boolean;
    data?: {
        id: number;
        url: string;
        contentType: string;
        size: number;
    };
    error?: {
        message: string;
    };
}

/**
 * Upload an image file to D1 storage via the API
 * @param file - The file to upload
 * @returns The HTTP URL of the uploaded image
 */
export async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<UploadResponse>('/images', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    if (!response.data.success || !response.data.data?.url) {
        throw new Error(response.data.error?.message || 'Failed to upload image');
    }

    return response.data.data.url;
}

/**
 * Check if a string is a base64 data URL
 */
export function isBase64DataUrl(url: string): boolean {
    return url.startsWith('data:');
}

/**
 * Check if a string is a valid HTTP URL
 */
export function isHttpUrl(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://');
}
