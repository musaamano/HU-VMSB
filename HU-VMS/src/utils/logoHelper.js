// Logo Helper Utility for Haramaya University Logo Integration
// This utility helps load and set the university logo for PDF reports

import pdfGenerator from './pdfGenerator';

class LogoHelper {
    constructor() {
        this.logoLoaded = false;
        this.logoBase64 = null;
    }

    // Convert image file to base64
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Convert image URL to base64
    async urlToBase64(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };

            img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
            img.src = url;
        });
    }

    // Load logo from file input (for admin settings page)
    async loadFromFile(file) {
        try {
            const base64String = await this.fileToBase64(file);
            this.setLogo(base64String);

            return {
                success: true,
                message: 'University logo loaded successfully',
                base64: base64String
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to load logo: ' + error.message,
                error
            };
        }
    }

    // Load logo from URL (if logo is hosted online)
    async loadFromUrl(imageUrl) {
        try {
            const base64String = await this.urlToBase64(imageUrl);
            this.setLogo(base64String);

            return {
                success: true,
                message: 'University logo loaded from URL successfully',
                base64: base64String
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to load logo from URL: ' + error.message,
                error
            };
        }
    }

    // Set logo in both PDF generator and storage
    setLogo(base64String) {
        this.logoBase64 = base64String;
        this.logoLoaded = true;

        // Set in PDF generator
        pdfGenerator.setHaramayaLogo(base64String);

        // Store in localStorage for persistence
        localStorage.setItem('haramayaUniversityLogo', base64String);

        console.log('✅ University logo set successfully');
    }

    // Load logo from localStorage (on app startup)
    loadFromStorage() {
        try {
            const storedLogo = localStorage.getItem('haramayaUniversityLogo');
            if (storedLogo) {
                this.setLogo(storedLogo);
                console.log('✅ University logo loaded from storage');
                return true;
            } else {
                // If no stored logo, try to load from public folder automatically
                console.log('No stored logo found, attempting to load from public folder...');
                this.loadFromPublicFolder();
            }
            return false;
        } catch (error) {
            console.error('Failed to load logo from storage:', error);
            // Fallback to public folder
            this.loadFromPublicFolder();
            return false;
        }
    }

    // Load the university logo from public/Haramaya-768x576.png automatically
    async loadFromPublicFolder() {
        try {
            console.log('🔄 Attempting to load Haramaya University logo from public folder...');
            const logoUrl = '/Haramaya-768x576.png';
            const result = await this.loadFromUrl(logoUrl);

            if (result.success) {
                console.log('✅ University logo automatically loaded from public/Haramaya-768x576.png');
                console.log('💾 Logo saved to localStorage for future use');
                return result;
            }

            throw new Error(result.message);
        } catch (error) {
            console.warn('⚠️ Could not load logo from public folder:', error.message);
            console.log('📝 Using fallback placeholder logo design');
            return {
                success: false,
                message: 'Could not load logo from public folder: ' + error.message,
                error
            };
        }
    }

    // Remove logo
    removeLogo() {
        pdfGenerator.setHaramayaLogo(null);
        localStorage.removeItem('haramayaUniversityLogo');
        this.logoLoaded = false;
        this.logoBase64 = null;
        console.log('University logo removed');
    }

    // Check if logo is loaded
    isLogoLoaded() {
        return this.logoLoaded;
    }

    // Get current logo base64
    getLogoBase64() {
        return this.logoBase64;
    }

    // Get logo status
    getStatus() {
        return {
            loaded: this.logoLoaded,
            hasStoredLogo: !!localStorage.getItem('haramayaUniversityLogo'),
            message: this.logoLoaded ? 'Logo is active' : 'Using placeholder logo'
        };
    }
}

// Create singleton instance
const logoHelper = new LogoHelper();

// Auto-load logo from storage on import
logoHelper.loadFromStorage();

export default logoHelper;