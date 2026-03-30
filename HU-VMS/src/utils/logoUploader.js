// Logo Uploader Utility - Force load logo from specific path
// This utility specifically loads the Haramaya University logo from the public folder

import logoHelper from './logoHelper';
import autoLogoSetup from './autoLogoSetup';

class LogoUploader {
    constructor() {
        this.uploadInProgress = false;
    }

    // Force upload logo from the specific path provided by user
    async uploadFromPath(imagePath = '/Haramaya-768x576.png') {
        if (this.uploadInProgress) {
            console.log('⏳ Logo upload already in progress...');
            return { success: false, message: 'Upload already in progress' };
        }

        this.uploadInProgress = true;
        console.log(`🚀 Starting logo upload from: ${imagePath}`);

        try {
            // Clear any existing logo first
            logoHelper.removeLogo();
            console.log('🗑️ Cleared existing logo');

            // Force load from the specific path
            const result = await autoLogoSetup.loadFromSpecificPath(imagePath);

            if (result.success) {
                console.log('✅ Logo uploaded successfully!');
                console.log('📍 Logo is now available in:');
                console.log('   - PDF Reports');
                console.log('   - All dashboards');
                console.log('   - Export functions');
                console.log('   - localStorage for persistence');

                this.uploadInProgress = false;
                return {
                    success: true,
                    message: 'Haramaya University logo uploaded successfully',
                    path: imagePath,
                    status: logoHelper.getStatus()
                };
            } else {
                throw new Error(result.error || 'Failed to load logo');
            }

        } catch (error) {
            console.error('❌ Logo upload failed:', error);
            this.uploadInProgress = false;

            // Try to create a fallback placeholder
            console.log('🔄 Creating fallback placeholder...');
            autoLogoSetup.createPlaceholderLogo();

            return {
                success: false,
                message: 'Failed to upload logo: ' + error.message,
                fallback: 'Placeholder logo created',
                error
            };
        }
    }

    // Check current logo status
    getLogoStatus() {
        const status = logoHelper.getStatus();
        const setupStatus = autoLogoSetup.getStatus();

        return {
            ...status,
            ...setupStatus,
            logoBase64: logoHelper.getLogoBase64(),
            uploadInProgress: this.uploadInProgress
        };
    }

    // Test logo loading with multiple fallbacks
    async testLogoLoading() {
        console.log('🧪 Testing logo loading capabilities...');

        const testPaths = [
            '/Haramaya-768x576.png',
            '/haramaya-768x576.png',
            '/image.png',
            '/logo.png'
        ];

        for (const path of testPaths) {
            try {
                console.log(`Testing: ${path}`);
                const result = await this.uploadFromPath(path);
                if (result.success) {
                    console.log(`✅ Success with: ${path}`);
                    return result;
                }
            } catch (error) {
                console.log(`❌ Failed: ${path} - ${error.message}`);
            }
        }

        console.log('⚠️ All test paths failed, using placeholder');
        return { success: false, message: 'All test paths failed' };
    }

    // Force refresh logo system
    async refreshLogoSystem() {
        console.log('🔄 Refreshing logo system...');

        // Clear everything
        logoHelper.removeLogo();

        // Force reload
        const result = await autoLogoSetup.forceReload();

        console.log('✅ Logo system refreshed');
        return result;
    }
}

// Create and export singleton instance
const logoUploader = new LogoUploader();

export default logoUploader;