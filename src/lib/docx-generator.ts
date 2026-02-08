/**
 * DOCX Document Generator for Surat and Program Kerja
 * Uses docx library to generate Word documents
 */

import {
    Document,
    Paragraph,
    TextRun,
    AlignmentType,
    HeadingLevel,
    PageBreak,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    Packer,
    Header,
    Footer,
    PageNumber,
    NumberFormat,
    convertInchesToTwip
} from 'docx';

// ============================================
// Types
// ============================================

export interface SuratData {
    nomor_surat: string;
    jenis_kegiatan: string;
    tanggal_kegiatan: string;
    waktu_kegiatan: string;
    tempat_kegiatan: string;
    agenda: string;
    peserta?: string[];
    penanggung_jawab: string;
    isi_surat: string;
    created_at: string;
}

export interface ProkerData {
    tahun_ajaran: string;
    visi: string;
    misi: string;
    kegiatan: any[];
    analisis_kebutuhan?: string;
    isi_dokumen: string;
    created_at: string;
}

export interface KKGSettings {
    nama_ketua?: string;
    alamat_sekretariat?: string;
    tahun_ajaran?: string;
}

// ============================================
// Document Styles
// ============================================

const FONT_FAMILY = 'Times New Roman';
const FONT_SIZE_NORMAL = 24; // 12pt
const FONT_SIZE_SMALL = 22; // 11pt
const FONT_SIZE_HEADER = 28; // 14pt
const FONT_SIZE_TITLE = 32; // 16pt

// ============================================
// Helper Functions
// ============================================

function createParagraph(text: string, options: {
    bold?: boolean;
    italic?: boolean;
    alignment?: typeof AlignmentType[keyof typeof AlignmentType];
    spacing?: { before?: number; after?: number };
    indent?: { left?: number; right?: number; firstLine?: number };
    fontSize?: number;
} = {}): Paragraph {
    return new Paragraph({
        alignment: options.alignment || AlignmentType.JUSTIFIED,
        spacing: options.spacing || { after: 120 },
        indent: options.indent,
        children: [
            new TextRun({
                text: text,
                font: FONT_FAMILY,
                size: options.fontSize || FONT_SIZE_NORMAL,
                bold: options.bold,
                italics: options.italic,
            }),
        ],
    });
}

function parseContentToParagraphs(content: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
            // Empty line - add spacing
            paragraphs.push(new Paragraph({ spacing: { after: 120 } }));
            continue;
        }

        // Check for headers/sections
        if (trimmedLine.match(/^(BAB|BAGIAN)\s+[IVX\d]+/i)) {
            paragraphs.push(createParagraph(trimmedLine, {
                bold: true,
                alignment: AlignmentType.CENTER,
                fontSize: FONT_SIZE_HEADER,
                spacing: { before: 240, after: 120 }
            }));
        } else if (trimmedLine.match(/^[A-Z][A-Z\s]+:?$/)) {
            // All caps section header
            paragraphs.push(createParagraph(trimmedLine, {
                bold: true,
                alignment: AlignmentType.LEFT,
                spacing: { before: 240, after: 120 }
            }));
        } else if (trimmedLine.match(/^\d+\.\s+/)) {
            // Numbered list
            paragraphs.push(createParagraph(trimmedLine, {
                alignment: AlignmentType.JUSTIFIED,
                indent: { left: convertInchesToTwip(0.5) }
            }));
        } else if (trimmedLine.match(/^[-•]\s+/)) {
            // Bullet list
            paragraphs.push(createParagraph(trimmedLine, {
                alignment: AlignmentType.JUSTIFIED,
                indent: { left: convertInchesToTwip(0.75) }
            }));
        } else {
            // Normal paragraph
            paragraphs.push(createParagraph(trimmedLine, {
                alignment: AlignmentType.JUSTIFIED
            }));
        }
    }

    return paragraphs;
}

// ============================================
// Surat Generator
// ============================================

export function generateSuratDocx(data: SuratData, settings: KKGSettings): Document {
    const contentParagraphs = parseContentToParagraphs(data.isi_surat);

    const doc = new Document({
        creator: 'Portal Digital KKG Gugus 3 Wanayasa',
        title: `Surat Undangan - ${data.jenis_kegiatan}`,
        description: `Surat undangan untuk ${data.jenis_kegiatan}`,
        styles: {
            default: {
                document: {
                    run: {
                        font: FONT_FAMILY,
                        size: FONT_SIZE_NORMAL,
                    },
                    paragraph: {
                        spacing: { line: 276 }, // 1.15 line spacing
                    },
                },
            },
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(1),
                            right: convertInchesToTwip(1),
                            bottom: convertInchesToTwip(1),
                            left: convertInchesToTwip(1.25),
                        },
                    },
                },
                headers: {
                    default: new Header({
                        children: [
                            // KOP SURAT
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 0 },
                                children: [
                                    new TextRun({
                                        text: 'PEMERINTAH KABUPATEN PURWAKARTA',
                                        font: FONT_FAMILY,
                                        size: FONT_SIZE_HEADER,
                                        bold: true,
                                    }),
                                ],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 0 },
                                children: [
                                    new TextRun({
                                        text: 'DINAS PENDIDIKAN',
                                        font: FONT_FAMILY,
                                        size: FONT_SIZE_TITLE,
                                        bold: true,
                                    }),
                                ],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 0 },
                                children: [
                                    new TextRun({
                                        text: 'KELOMPOK KERJA GURU (KKG) GUGUS 3',
                                        font: FONT_FAMILY,
                                        size: FONT_SIZE_HEADER,
                                        bold: true,
                                    }),
                                ],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 0 },
                                children: [
                                    new TextRun({
                                        text: 'KECAMATAN WANAYASA',
                                        font: FONT_FAMILY,
                                        size: FONT_SIZE_HEADER,
                                        bold: true,
                                    }),
                                ],
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 120 },
                                children: [
                                    new TextRun({
                                        text: settings.alamat_sekretariat || 'Jl. Raya Wanayasa, Kec. Wanayasa, Kab. Purwakarta',
                                        font: FONT_FAMILY,
                                        size: FONT_SIZE_SMALL,
                                    }),
                                ],
                            }),
                            // Garis pembatas
                            new Paragraph({
                                border: {
                                    bottom: {
                                        color: '000000',
                                        style: BorderStyle.DOUBLE,
                                        size: 12,
                                    },
                                },
                                spacing: { after: 240 },
                            }),
                        ],
                    }),
                },
                children: [
                    // Nomor Surat
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { after: 0 },
                        children: [
                            new TextRun({ text: 'Nomor\t: ', font: FONT_FAMILY, size: FONT_SIZE_NORMAL }),
                            new TextRun({ text: data.nomor_surat, font: FONT_FAMILY, size: FONT_SIZE_NORMAL }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { after: 0 },
                        children: [
                            new TextRun({ text: 'Lampiran\t: -', font: FONT_FAMILY, size: FONT_SIZE_NORMAL }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { after: 240 },
                        children: [
                            new TextRun({ text: 'Perihal\t: ', font: FONT_FAMILY, size: FONT_SIZE_NORMAL }),
                            new TextRun({ text: `Undangan ${data.jenis_kegiatan}`, font: FONT_FAMILY, size: FONT_SIZE_NORMAL, bold: true }),
                        ],
                    }),

                    // Content from AI
                    ...contentParagraphs,

                    // Signature section
                    new Paragraph({ spacing: { before: 480, after: 0 } }),
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 0 },
                        indent: { left: convertInchesToTwip(3.5) },
                        children: [
                            new TextRun({
                                text: `Wanayasa, ${new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                                font: FONT_FAMILY,
                                size: FONT_SIZE_NORMAL,
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 0 },
                        indent: { left: convertInchesToTwip(3.5) },
                        children: [
                            new TextRun({
                                text: 'Ketua KKG Gugus 3 Wanayasa',
                                font: FONT_FAMILY,
                                size: FONT_SIZE_NORMAL,
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 720, after: 0 },
                        indent: { left: convertInchesToTwip(3.5) },
                        children: [
                            new TextRun({
                                text: settings.nama_ketua || data.penanggung_jawab || '............................',
                                font: FONT_FAMILY,
                                size: FONT_SIZE_NORMAL,
                                bold: true,
                                underline: {},
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        indent: { left: convertInchesToTwip(3.5) },
                        children: [
                            new TextRun({
                                text: 'NIP. ................................',
                                font: FONT_FAMILY,
                                size: FONT_SIZE_SMALL,
                            }),
                        ],
                    }),
                ],
            },
        ],
    });

    return doc;
}

// ============================================
// Program Kerja Generator
// ============================================

export function generateProkerDocx(data: ProkerData, settings: KKGSettings): Document {
    const contentParagraphs = parseContentToParagraphs(data.isi_dokumen);

    const doc = new Document({
        creator: 'Portal Digital KKG Gugus 3 Wanayasa',
        title: `Program Kerja KKG - Tahun Ajaran ${data.tahun_ajaran}`,
        description: `Program Kerja Tahunan KKG Gugus 3 Wanayasa`,
        styles: {
            default: {
                document: {
                    run: {
                        font: FONT_FAMILY,
                        size: FONT_SIZE_NORMAL,
                    },
                    paragraph: {
                        spacing: { line: 276 },
                    },
                },
            },
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(1),
                            right: convertInchesToTwip(1),
                            bottom: convertInchesToTwip(1),
                            left: convertInchesToTwip(1.25),
                        },
                    },
                },
                children: [
                    // Cover Page
                    new Paragraph({ spacing: { before: 1440 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: 'PROGRAM KERJA',
                                font: FONT_FAMILY,
                                size: 48, // 24pt
                                bold: true,
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                        children: [
                            new TextRun({
                                text: 'KELOMPOK KERJA GURU (KKG)',
                                font: FONT_FAMILY,
                                size: 40, // 20pt
                                bold: true,
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                        children: [
                            new TextRun({
                                text: 'GUGUS 3 KECAMATAN WANAYASA',
                                font: FONT_FAMILY,
                                size: 40,
                                bold: true,
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 480 },
                        children: [
                            new TextRun({
                                text: `TAHUN AJARAN ${data.tahun_ajaran}`,
                                font: FONT_FAMILY,
                                size: 36,
                                bold: true,
                            }),
                        ],
                    }),
                    new Paragraph({ spacing: { before: 960 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: 'DINAS PENDIDIKAN',
                                font: FONT_FAMILY,
                                size: FONT_SIZE_HEADER,
                                bold: true,
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: 'KABUPATEN PURWAKARTA',
                                font: FONT_FAMILY,
                                size: FONT_SIZE_HEADER,
                                bold: true,
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: new Date(data.created_at).getFullYear().toString(),
                                font: FONT_FAMILY,
                                size: FONT_SIZE_HEADER,
                            }),
                        ],
                    }),

                    // Page break
                    new Paragraph({
                        children: [new PageBreak()],
                    }),

                    // Content from AI
                    ...contentParagraphs,
                ],
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: 'Program Kerja KKG Gugus 3 Wanayasa - ',
                                        font: FONT_FAMILY,
                                        size: 20,
                                    }),
                                    new TextRun({
                                        children: [PageNumber.CURRENT],
                                        font: FONT_FAMILY,
                                        size: 20,
                                    }),
                                ],
                            }),
                        ],
                    }),
                },
            },
        ],
    });

    return doc;
}

// ============================================
// Export to Buffer
// ============================================

export async function generateSuratBuffer(data: SuratData, settings: KKGSettings): Promise<Uint8Array> {
    const doc = generateSuratDocx(data, settings);
    const buffer = await Packer.toBuffer(doc);
    return new Uint8Array(buffer);
}

export async function generateProkerBuffer(data: ProkerData, settings: KKGSettings): Promise<Uint8Array> {
    const doc = generateProkerDocx(data, settings);
    const buffer = await Packer.toBuffer(doc);
    return new Uint8Array(buffer);
}
