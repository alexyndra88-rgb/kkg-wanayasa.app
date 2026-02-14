import { createClient } from '@supabase/supabase-js';

export interface StorageBindings {
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
    SUPABASE_BUCKET: string;
}

export const getSupabaseClient = (env: StorageBindings) => {
    return createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
};

export const uploadFile = async (
    env: StorageBindings,
    file: File,
    folder: string = ''
): Promise<{ path: string; url: string; error?: string }> => {
    try {
        if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
            console.error('Missing Supabase credentials in env:', Object.keys(env));
            return { path: '', url: '', error: 'Server configuration error: Missing Supabase credentials' };
        }
        const supabase = getSupabaseClient(env);
        const bucket = env.SUPABASE_BUCKET || 'materi-kkg';

        // Sanitize filename and add timestamp to avoid collisions
        const timestamp = Date.now();
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = folder ? `${folder}/${timestamp}_${cleanName}` : `${timestamp}_${cleanName}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return { path: '', url: '', error: error.message };
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return {
            path: data.path,
            url: publicUrlData.publicUrl
        };
    } catch (e: any) {
        console.error('Storage upload exception:', e);
        return { path: '', url: '', error: e.message || 'Unknown error' };
    }
};

export const deleteFile = async (
    env: StorageBindings,
    path: string
): Promise<{ error?: string }> => {
    try {
        const supabase = getSupabaseClient(env);
        const bucket = env.SUPABASE_BUCKET;

        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            return { error: error.message };
        }

        return {};
    } catch (e: any) {
        return { error: e.message };
    }
};
