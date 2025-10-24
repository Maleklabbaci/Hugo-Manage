import { createClient } from '@supabase/supabase-js';
import { storage } from './storage';

/*
-- =================================================================
-- SCRIPT SQL POUR LE STOCKAGE SUPABASE - À EXÉCUTER
-- =================================================================
--
-- Pour que le stockage des images fonctionne, exécutez ce script
-- dans votre éditeur SQL Supabase.
--
-- Cela crée un "bucket" public pour les images de produits et
-- configure les permissions de sécurité.
--
-- =================================================================

-- 1. Créer un bucket public pour les images de produits
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurer les politiques de sécurité (RLS) pour le bucket
-- Supprime les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own product images" ON storage.objects;

-- 2.1 Autoriser l'accès public en lecture aux images
CREATE POLICY "Public read access for product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- 2.2 Autoriser les utilisateurs connectés à envoyer des images
CREATE POLICY "Users can manage their own product images" ON storage.objects
FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 2.3 Autoriser les utilisateurs à mettre à jour leurs propres images
CREATE POLICY "Users can update their own product images" ON storage.objects
FOR UPDATE USING (auth.uid() = owner_id);

-- 2.4 Autoriser les utilisateurs à supprimer leurs propres images
CREATE POLICY "Users can delete their own product images" ON storage.objects
FOR DELETE USING (auth.uid() = owner_id);

*/

const { url: supabaseUrl, anonKey: supabaseAnonKey } = storage.getSupabaseCredentials();

export const supabaseClient = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

const BUCKET_NAME = 'product-images';

/**
 * Upload an image file to Supabase Storage.
 * @param file The image file to upload.
 * @param userId The ID of the user uploading the file.
 * @returns The public URL of the uploaded image.
 */
export const uploadImage = async (file: File, userId: string): Promise<string> => {
    if (!supabaseClient) throw new Error("Supabase client is not initialized.");
    
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${new Date().getTime()}.${fileExt}`;

    const { error: uploadError } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            // cacheControl: '3600', // Cache for 1 hour
            upsert: false,
        });

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
};

/**
 * Deletes an image from Supabase Storage using its public URL.
 * @param imageUrl The public URL of the image to delete.
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
    if (!supabaseClient || !imageUrl) return;
    try {
        const url = new URL(imageUrl);
        const path = url.pathname.split(`/${BUCKET_NAME}/`)[1];
        
        if (path) {
            const { error } = await supabaseClient.storage.from(BUCKET_NAME).remove([path]);
            if (error) {
                console.error("Error deleting image from storage:", error.message);
            }
        }
    } catch (error) {
        console.error("Invalid image URL for deletion:", imageUrl, error);
    }
};
