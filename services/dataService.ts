/**
 * Data Service for SubTrack Pro
 * Handles communication with Cloudflare Pages API (/api/data)
 */

import { Job, Payment } from '../types';

export interface AppData {
    jobs: Job[];
    payments: Payment[];
}

const API_URL = '/api/data';

/**
 * Fetch all data from the server
 */
export async function fetchData(): Promise<AppData> {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            if (response.status === 401) {
                // Not authenticated - the middleware should handle this, 
                // but as a fallback we can reload
                window.location.reload();
                throw new Error('Not authenticated');
            }
            throw new Error(`Failed to fetch data: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        // Return empty data as fallback
        return { jobs: [], payments: [] };
    }
}

/**
 * Save all data to the server
 */
export async function saveData(data: AppData): Promise<boolean> {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.reload();
                throw new Error('Not authenticated');
            }
            throw new Error(`Failed to save data: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}
