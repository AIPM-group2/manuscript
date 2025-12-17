// Document History Store - stores metadata of analyzed documents
import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { user } from './auth';

const HISTORY_LIMIT = 5;
const STORAGE_KEY = 'manuscript_doc_history';

export interface DocumentHistoryItem {
    id: string;
    fileName: string;
    analyzedAt: string;
    passRate: number;
    totalRules: number;
    passedRules: number;
    failedRules: number;
}

function createDocumentHistoryStore() {
    const { subscribe, set, update } = writable<DocumentHistoryItem[]>([]);

    // Get storage key for current user
    function getStorageKey(): string {
        const currentUser = get(user);
        const userEmail = currentUser?.email || 'anonymous';
        return `${STORAGE_KEY}_${userEmail}`;
    }

    // Load history from localStorage
    function load(): DocumentHistoryItem[] {
        if (!browser) return [];

        try {
            const key = getStorageKey();
            const stored = localStorage.getItem(key);
            if (stored) {
                const items = JSON.parse(stored) as DocumentHistoryItem[];
                set(items);
                return items;
            }
        } catch (e) {
            console.error('Failed to load document history:', e);
        }
        return [];
    }

    // Save history to localStorage
    function save(items: DocumentHistoryItem[]) {
        if (!browser) return;

        try {
            const key = getStorageKey();
            localStorage.setItem(key, JSON.stringify(items));
        } catch (e) {
            console.error('Failed to save document history:', e);
        }
    }

    return {
        subscribe,

        // Load history on init
        init: () => {
            load();
        },

        // Add a new document to history
        addDocument: (
            fileName: string,
            passRate: number,
            totalRules: number,
            passedRules: number,
            failedRules: number
        ) => {
            const newItem: DocumentHistoryItem = {
                id: crypto.randomUUID(),
                fileName,
                analyzedAt: new Date().toISOString(),
                passRate,
                totalRules,
                passedRules,
                failedRules
            };

            update(items => {
                // Add new item at the beginning
                const updated = [newItem, ...items];
                // Keep only the last HISTORY_LIMIT items
                const limited = updated.slice(0, HISTORY_LIMIT);
                save(limited);
                return limited;
            });

            return newItem;
        },

        // Clear all history
        clear: () => {
            set([]);
            if (browser) {
                const key = getStorageKey();
                localStorage.removeItem(key);
            }
        },

        // Reload history (e.g., after user login)
        reload: () => {
            load();
        }
    };
}

export const documentHistory = createDocumentHistoryStore();
