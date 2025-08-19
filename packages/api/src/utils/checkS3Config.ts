/**
 * Utility to check S3 configuration and provide helpful error messages
 */
export function checkS3Configuration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    const requiredVars = [
        'S3_REGION',
        'S3_ACCESS_KEY_ID',
        'S3_SECRET_ACCESS_KEY',
        'NEXT_PUBLIC_AVATAR_BUCKET_NAME',
        'NEXT_PUBLIC_STORAGE_URL'
    ];

    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            errors.push(`Missing environment variable: ${varName}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function logS3Configuration(): void {
    console.log("S3 Configuration Check:");
    console.log("======================");

    const config = checkS3Configuration();

    if (config.isValid) {
        console.log("✅ All required S3 environment variables are set");
    } else {
        console.log("❌ S3 configuration issues found:");
        config.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log("\nOptional S3 variables:");
    console.log(`  - S3_ENDPOINT: ${process.env.S3_ENDPOINT || 'not set (using AWS default)'}`);
    console.log(`  - S3_FORCE_PATH_STYLE: ${process.env.S3_FORCE_PATH_STYLE || 'not set (default: false)'}`);
    console.log("======================");
}