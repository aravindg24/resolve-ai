import { supabase } from './supabaseClient';
import { StoredScan } from '../types';

// Generate or retrieve a persistent Device ID (local storage only)
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('RESOLVE_DEVICE_ID');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('RESOLVE_DEVICE_ID', deviceId);
  }
  return deviceId;
};

export const saveScan = async (scan: StoredScan): Promise<void> => {
  const deviceId = getDeviceId();

  // Transform data for Supabase Schema
  const { error } = await supabase
    .from('scans')
    .insert({
      id: scan.id,
      created_at: new Date(scan.timestamp).toISOString(),
      user_id: deviceId, // Storing Device ID in user_id column for simple grouping
      media_items: scan.media,
      analysis: scan.analysis,
      query: scan.query,
    });

  if (error) {
    console.error('Error saving scan to Supabase:', error);
    throw error;
  }
};

export const getHistory = async (): Promise<StoredScan[]> => {
  const deviceId = getDeviceId();

  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', deviceId) // Only fetch this device's scans
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    timestamp: new Date(row.created_at).getTime(),
    analysis: row.analysis,
    media: row.media_items,
    completedSteps: [],
    skillLevel: 'Novice', // Default if not stored, or update schema to store it
    query: row.query
  }));
};

export const deleteScan = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('scans')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting scan:', error);
    throw error;
  }
};
