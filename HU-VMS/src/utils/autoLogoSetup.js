// Automatic Logo Setup for HU-VMS
// This script ensures the Haramaya University logo is automatically loaded and available

import logoHelper from './logoHelper';

class AutoLogoSetup {
    constructor() {
        this.logoLoaded = false;
        this.setupComplete = false;
    }

    // Automatically setup and load the university logo
    async initialize() {
        console.log('🚀 Initializing automatic logo setup...');

        try {
            // Step 1: Try to load from localStorage first
            const storageResult = logoHelper.loadFromStorage();

            if (storageResult) {
                console.log('✅ Logo loaded from storage successfully');
                this.logoLoaded = true;
                this.setupComplete = true;
                return { success: true, source: 'storage' };
            }

            // Step 2: If no stored logo, try to load from public folder
            console.log('📁 No stored logo found, loading from public folder...');
            const publicResult = await logoHelper.loadFromPublicFolder();

            if (publicResult.success) {
                console.log('✅ Logo loaded from public folder and saved to storage');
                this.logoLoaded = true;
                this.setupComplete = true;
                return { success: true, source: 'public' };
            }

            // Step 3: If public folder fails, try alternative URLs
            console.log('🔄 Trying alternative logo sources...');
            const alternativeUrls = [
                '/image.png',
                '/logo.png',
                '/haramaya-logo.png'
            ];

            for (const url of alternativeUrls) {
                try {
                    const result = await logoHelper.loadFromUrl(url);
                    if (result.success) {
                        console.log(`✅ Logo loaded from alternative source: ${url}`);
                        this.logoLoaded = true;
                        this.setupComplete = true;
                        return { success: true, source: 'alternative', url };
                    }
                } catch (error) {
                    console.log(`⚠️ Failed to load from ${url}:`, error.message);
                    continue;
                }
            }

            // Step 4: If all fails, create a placeholder
            console.log('📝 Creating placeholder logo...');
            this.createPlaceholderLogo();
            this.setupComplete = true;
            return { success: true, source: 'placeholder' };

        } catch (error) {
            console.error('❌ Auto logo setup failed:', error);
            this.setupComplete = true;
            return { success: false, error: error.message };
        }
    }

    // Create a placeholder logo if no real logo is available
    createPlaceholderLogo() {
        // Create a simple SVG logo as base64
        const svgLogo = `
            <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="95" fill="#4a90e2" stroke="#1e3c72" stroke-width="5"/>
                <circle cx="100" cy="100" r="75" fill="none" stroke="#ffffff" stroke-width="2"/>
                <text x="100" y="85" text-anchor="middle" fill="white" font-family="serif" font-size="16" font-weight="bold">HARAMAYA</text>
                <text x="100" y="105" text-anchor="middle" fill="white" font-family="serif" font-size="16" font-weight="bold">UNIVERSITY</text>
                <text x="100" y="125" text-anchor="middle" fill="white" font-family="serif" font-size="10">ETHIOPIA</text>
            </svg>
        `;

        // Convert SVG to base64
        const base64Logo = `data:image/svg+xml;base64,${btoa(svgLogo)}`;

        // Set the placeholder logo using logoHelper
        logoHelper.setLogo(base64Logo);

        console.log('✅ Placeholder logo created and stored');
        this.logoLoaded = true;
    }

    // Check if logo is loaded and ready
    isLogoReady() {
        return this.logoLoaded && this.setupComplete;
    }

    // Get logo status
    getStatus() {
        return {
            logoLoaded: this.logoLoaded,
            setupComplete: this.setupComplete,
            hasStoredLogo: !!localStorage.getItem('haramayaUniversityLogo')
        };
    }

    // Force reload logo
    async forceReload() {
        console.log('🔄 Force reloading logo...');
        this.logoLoaded = false;
        this.setupComplete = false;

        // Clear stored logo
        localStorage.removeItem('haramayaUniversityLogo');

        // Reinitialize
        return await this.initialize();
    }

    // Upload custom logo (for admin use)
    async uploadCustomLogo(file) {
        try {
            console.log('📤 Uploading custom logo...');
            const result = await logoHelper.loadFromFile(file);

            if (result.success) {
                console.log('✅ Custom logo uploaded successfully');
                this.logoLoaded = true;
                return { success: true, message: 'Custom logo uploaded successfully' };
            }

            throw new Error('Failed to upload custom logo');
        } catch (error) {
            console.error('❌ Custom logo upload failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Force load from specific path (for the user's request)
    async loadFromSpecificPath(imagePath) {
        try {
            console.log(`🔄 Loading logo from specific path: ${imagePath}`);
            const result = await logoHelper.loadFromUrl(imagePath);

            if (result.success) {
                console.log(`✅ Logo loaded successfully from ${imagePath}`);
                this.logoLoaded = true;
                this.setupComplete = true;
                return { success: true, source: 'specific-path', path: imagePath };
            }

            throw new Error(result.message);
        } catch (error) {
            console.error(`❌ Failed to load logo from ${imagePath}:`, error);
            return { success: false, error: error.message };
        }
    }
}

// Create and export singleton instance
const autoLogoSetup = new AutoLogoSetup();

// Auto-initialize when module is imported
autoLogoSetup.initialize().then(result => {
    if (result.success) {
        console.log(`🎉 Auto logo setup completed successfully from ${result.source}`);
    } else {
        console.warn('⚠️ Auto logo setup completed with issues');
    }
});

export default autoLogoSetup;