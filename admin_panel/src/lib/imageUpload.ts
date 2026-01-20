import api from './api';

interface UploadResponse {
    success: boolean;
    data?: {
        url: string;
        key: string;
        filename: string;
        size: number;
        contentType: string;
    };
    error?: {
        message: string;
    };
}

/**
 * Upload an image file to R2 storage via the API
 * @param file - The file to upload
 * @returns The HTTP URL of the uploaded image
 */
export async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>('/admin/upload', formData, {
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
 * Upload a base64 image to R2 storage via the API
 * @param base64 - The base64 data URL (e.g., data:image/png;base64,...)
 * @returns The HTTP URL of the uploaded image
 */
export async function uploadBase64Image(base64: string): Promise<string> {
    const response = await api.post<UploadResponse>('/admin/upload', {
        base64,
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
