import { supabase } from '../lib/supabase';

export const settingsService = {
  async getSetting(key: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error) {
        // Ignore "no rows returned" error which is expected for new keys
        if (error.code !== 'PGRST116') {
            console.error('Error fetching setting:', error);
        }
        return null;
    }
    return data?.value || null;
  },

  async saveSetting(key: string, value: string): Promise<void> {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    
    if (error) {
        console.error('Error saving setting:', error);
        throw error;
    }
  }
};

