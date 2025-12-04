import { writable } from 'svelte/store';

export const user = writable(null);
export const apiKey = writable('');

// Check for saved auth on load
if (typeof window !== 'undefined') {
    const savedApiKey = localStorage.getItem('apiKey');
    const savedUser = localStorage.getItem('user');

    if (savedApiKey) {
        apiKey.set(savedApiKey);
    }

    if (savedUser) {
        try {
            user.set(JSON.parse(savedUser));
        } catch (e) {
            console.error('Failed to parse saved user');
        }
    }
}

export function login(email, password) {
    // Demo login - in production, this would call an API
    const demoUser = {
        id: '1',
        email: email,
        name: email.split('@')[0]
    };

    localStorage.setItem('user', JSON.stringify(demoUser));
    user.set(demoUser);
    return true;
}

export function signup(email, password, name) {
    // Demo signup
    const newUser = {
        id: Date.now().toString(),
        email,
        name
    };

    localStorage.setItem('user', JSON.stringify(newUser));
    user.set(newUser);
    return true;
}

export function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('apiKey');
    user.set(null);
    apiKey.set('');
}

export function saveApiKey(key) {
    localStorage.setItem('apiKey', key);
    apiKey.set(key);
}
