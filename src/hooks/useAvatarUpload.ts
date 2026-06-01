import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAvatarUpload(userId?: string) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const upload = async (file: File): Promise<string | null> => {
    if (!userId) return null;
    setUploading(true);
    setError(null);

    try {
      // Valida tamanho (max 5MB) e tipo
      if (file.size > 5 * 1024 * 1024) throw new Error('Arquivo muito grande. Máximo 5MB.');
      if (!['image/jpeg','image/png','image/webp'].includes(file.type))
        throw new Error('Formato inválido. Use JPG, PNG ou WebP.');

      const ext  = file.name.split('.').pop() ?? 'jpg';
      const path = `${userId}/avatar.${ext}`;

      // Faz upload (upsert substitui se já existir)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // URL pública
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`; // cache busting

      // Salva no perfil
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', userId);

      return publicUrl;
    } catch (err: any) {
      setError(err.message ?? 'Erro no upload.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}
