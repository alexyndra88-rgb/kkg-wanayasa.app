import { Hono } from 'hono';
import { AIService } from '../services/ai';
import { successResponse, Errors } from '../lib/response';

const presentation = new Hono<{ Bindings: any }>();

// Generate Slide Content
presentation.post('/generate', async (c) => {
    try {
        const { topic, audience, slideCount, model } = await c.req.json();
        const user = c.get('user');

        const ai = new AIService(c.env);

        const count = slideCount || 7;

        const prompt = `
            Bertindaklah sebagai desainer presentasi profesional dan ahli pendidikan.
            Buatlah struktur konten presentasi powerpoint yang MENARIK, VISUAL, dan EDUKATIF.
            
            Topik: "${topic}"
            Target Audiens: ${audience || 'Siswa SD/MI'}
            Jumlah Slide: ${count}
            
            Format Output JSON (Strict):
            {
               "title": "Judul Menarik",
               "slides": [
                  {
                     "number": 1,
                     "title": "Judul Slide",
                     "content": {
                        "bullets": ["Poin 1", "Poin 2"],
                        "imagePrompt": "Deskripsi gambar untuk AI generator",
                        "speakerNotes": "Catatan untuk pembicara"
                     },
                     "layout": "TITLE_AND_CONTENT"
                  }
               ],
               "themeSuggestion": "Modern/Playful/Minimalist"
            }
            
            Pastikan konten sesuai untuk audiens ${audience}. Gunakan bahasa Indonesia yang baik dan benar.
        `;

        const result = await ai.generateJSON(prompt, model || 'gemini');

        // Save History (Optional)
        // await c.env.DB.prepare(...)

        return successResponse(c, result);

    } catch (e: any) {
        return Errors.internal(c, e.message);
    }
});

export default presentation;
