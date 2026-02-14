import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';
import { Mistral } from '@mistralai/mistralai';

export type AIProvider = 'gemini' | 'groq' | 'mistral';

interface AIResponse {
    content: string;
    provider: AIProvider;
    model: string;
}

export class AIService {
    private geminiKeys: string[];
    private groqKeys: string[];
    private mistralKeys: string[];

    constructor(env: Record<string, string>) {
        this.geminiKeys = this.extractKeys(env, 'GEMINI_API_KEY');
        this.groqKeys = this.extractKeys(env, 'GROQ_API_KEY');
        this.mistralKeys = this.extractKeys(env, 'MISTRAL_API_KEY');
    }

    private extractKeys(env: Record<string, string>, prefix: string): string[] {
        const keys: string[] = [];

        // 1. Direct match
        if (env[prefix]) {
            if (env[prefix].includes(',')) {
                env[prefix].split(',').forEach(k => keys.push(k.trim()));
            } else {
                keys.push(env[prefix]);
            }
        }

        // 2. Numbered suffixes (e.g. GEMINI_API_KEY_1)
        Object.keys(env).forEach(key => {
            if (key.startsWith(prefix) && key !== prefix) {
                keys.push(env[key]);
            }
        });

        return [...new Set(keys)].filter(k => k && k.length > 0);
    }

    private getRandomKey(keys: string[]): string {
        if (keys.length === 0) return '';
        return keys[Math.floor(Math.random() * keys.length)];
    }

    // Allow injecting keys from database settings at runtime
    addKey(provider: AIProvider, key: string) {
        if (!key || key.length === 0) return;
        if (provider === 'gemini' && !this.geminiKeys.includes(key)) this.geminiKeys.push(key);
        if (provider === 'groq' && !this.groqKeys.includes(key)) this.groqKeys.push(key);
        if (provider === 'mistral' && !this.mistralKeys.includes(key)) this.mistralKeys.push(key);
    }

    async generateJSON(prompt: string, preferredProvider: AIProvider = 'gemini'): Promise<any> {
        let result = await this.generateText(prompt, preferredProvider, true);
        let content = result.content;

        // 1. Extract content between first { and last }
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            content = content.substring(firstBrace, lastBrace + 1);
        } else {
            console.error('No JSON braces found in response:', content);
            throw new Error('AI response does not contain valid JSON structure');
        }

        // 2. Try parsing
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error('JSON Parse Error:', e);
            console.error('Cleaned content:', content);

            // 3. Fallback: Try to cleanup common issues (newlines in strings, etc) if simple parse fails
            try {
                // Remove potential control characters that break JSON
                const sanitized = content.replace(/[\x00-\x1F\x7F-\x9F]/g, (c) => {
                    return ['\r', '\n', '\t'].includes(c) ? c : '';
                });
                return JSON.parse(sanitized);
            } catch (e2) {
                console.error('Retry Parse Error:', e2);
                throw new Error('Failed to parse AI response as JSON');
            }
        }
    }

    async generateText(prompt: string, preferredProvider: AIProvider = 'gemini', jsonMode: boolean = false): Promise<AIResponse> {
        // Try preferred provider first
        try {
            if (preferredProvider === 'gemini') return await this.callGemini(prompt, jsonMode);
            if (preferredProvider === 'groq') return await this.callGroq(prompt, jsonMode);
            if (preferredProvider === 'mistral') return await this.callMistral(prompt, jsonMode);
        } catch (e) {
            console.warn(`${preferredProvider} failed, trying failover...`, e);
        }

        // Failover logic
        const providers: AIProvider[] = ['gemini', 'groq', 'mistral'];
        const remaining = providers.filter(p => p !== preferredProvider);

        for (const provider of remaining) {
            try {
                if (provider === 'gemini') return await this.callGemini(prompt, jsonMode);
                if (provider === 'groq') return await this.callGroq(prompt, jsonMode);
                if (provider === 'mistral') return await this.callMistral(prompt, jsonMode);
            } catch (e) {
                console.warn(`${provider} failed...`, e);
            }
        }

        throw new Error('All AI providers failed');
    }

    private async callGemini(prompt: string, jsonMode: boolean): Promise<AIResponse> {
        const key = this.getRandomKey(this.geminiKeys);
        if (!key) throw new Error('No Gemini keys available');

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash', // Use faster model
            generationConfig: {
                responseMimeType: jsonMode ? 'application/json' : 'text/plain'
            }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return {
            content: response.text(),
            provider: 'gemini',
            model: 'gemini-2.0-flash'
        };
    }

    private async callGroq(prompt: string, jsonMode: boolean): Promise<AIResponse> {
        const key = this.getRandomKey(this.groqKeys);
        if (!key) throw new Error('No Groq keys available');

        const groq = new Groq({ apiKey: key });
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            response_format: jsonMode ? { type: 'json_object' } : undefined
        });

        return {
            content: completion.choices[0]?.message?.content || '',
            provider: 'groq',
            model: 'llama-3.3-70b-versatile'
        };
    }

    private async callMistral(prompt: string, jsonMode: boolean): Promise<AIResponse> {
        const key = this.getRandomKey(this.mistralKeys);
        if (!key) throw new Error('No Mistral keys available');

        const client = new Mistral({ apiKey: key });
        const completion = await client.chat.complete({
            model: 'mistral-small-latest',
            messages: [{ role: 'user', content: prompt }],
            responseFormat: jsonMode ? { type: 'json_object' } : undefined
        });

        // Handle string | ContentChunk[]
        let content = '';
        const messageContent = completion.choices?.[0]?.message.content;

        if (typeof messageContent === 'string') {
            content = messageContent;
        } else if (Array.isArray(messageContent)) {
            // Assume text chunk
            content = messageContent.map((c: any) => c.text || '').join('');
        }

        return {
            content: content || '',
            provider: 'mistral',
            model: 'mistral-small-latest'
        };
    }
}
