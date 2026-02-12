
/**
 * Compress image file before upload
 * @param {File} file - The file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed file
 */
export async function compressImage(file, options = {}) {
    const {
        maxWidth = 800,
        maxHeight = 800,
        quality = 0.8,
        type = 'image/jpeg'
    } = options;

    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, {
                        type: type,
                        lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                }, type, quality);
            };
            img.onerror = () => resolve(file); // Fail gracefully
        };
        reader.onerror = () => resolve(file);
    });
}
