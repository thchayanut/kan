# S3 Bucket Configuration for Optimal Security & Performance

## Current Configuration Analysis

Based on the CLAUDE.md file, the current setup:
- **Bucket**: `kan-storage-loveganesh-lv`
- **Region**: `ap-southeast-1` (Singapore)
- **Access**: Currently configured for public read access
- **CORS**: Configured for web access

## Recommended S3 Bucket Policy

Since we now use presigned URLs exclusively, we can tighten security:

### 1. Bucket Policy (Restrict Public Access)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "DenyDirectPublicRead",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::kan-storage-loveganesh-lv/*",
            "Condition": {
                "StringNotEquals": {
                    "s3:authType": "REST-QUERY-STRING"
                }
            }
        },
        {
            "Sid": "AllowPresignedURLAccess",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::kan-storage-loveganesh-lv/*",
            "Condition": {
                "StringEquals": {
                    "s3:authType": "REST-QUERY-STRING"
                }
            }
        }
    ]
}
```

### 2. CORS Configuration

```json
[
    {
        "AllowedHeaders": [
            "Authorization",
            "Content-Type",
            "Content-Length",
            "Content-MD5",
            "Cache-Control",
            "x-amz-*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "HEAD"
        ],
        "AllowedOrigins": [
            "https://project.loveganesh.com",
            "http://localhost:3000"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-request-id"
        ],
        "MaxAgeSeconds": 86400
    }
]
```

### 3. Lifecycle Configuration

```json
{
    "Rules": [
        {
            "ID": "DeleteIncompleteMultipartUploads",
            "Status": "Enabled",
            "AbortIncompleteMultipartUpload": {
                "DaysAfterInitiation": 7
            }
        },
        {
            "ID": "DeleteFailedUploads",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "temp/"
            },
            "Expiration": {
                "Days": 1
            }
        }
    ]
}
```

## Security Improvements

### Current Issues
1. **Public Read Access**: Direct S3 URLs work without authentication
2. **Broad CORS**: May allow unnecessary origins
3. **No Lifecycle Rules**: Failed uploads accumulate

### Proposed Solutions
1. **Presigned URLs Only**: Block direct access, only allow presigned URLs
2. **Restricted CORS**: Limit to specific domains
3. **Cleanup Rules**: Auto-delete failed/incomplete uploads
4. **CloudFront Integration**: Add CDN for better performance and security

## Implementation Steps

### Step 1: Update CORS Configuration
```bash
aws s3api put-bucket-cors \
  --bucket kan-storage-loveganesh-lv \
  --cors-configuration file://cors-config.json
```

### Step 2: Apply Bucket Policy
```bash
aws s3api put-bucket-policy \
  --bucket kan-storage-loveganesh-lv \
  --policy file://bucket-policy.json
```

### Step 3: Set Lifecycle Rules
```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket kan-storage-loveganesh-lv \
  --lifecycle-configuration file://lifecycle-config.json
```

### Step 4: Enable Versioning & Logging (Optional)
```bash
# Enable versioning for better data protection
aws s3api put-bucket-versioning \
  --bucket kan-storage-loveganesh-lv \
  --versioning-configuration Status=Enabled

# Enable access logging (optional)
aws s3api put-bucket-logging \
  --bucket kan-storage-loveganesh-lv \
  --bucket-logging-status file://logging-config.json
```

## Performance Optimizations

### 1. CloudFront Distribution Configuration

```json
{
    "CallerReference": "kan-images-cdn-2025",
    "Comment": "CDN for Kan application images",
    "DefaultRootObject": "",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-kan-storage",
                "DomainName": "kan-storage-loveganesh-lv.s3.ap-southeast-1.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-kan-storage",
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 86400,
        "DefaultTTL": 259200,
        "MaxTTL": 31536000,
        "Compress": true,
        "ForwardedValues": {
            "QueryString": true,
            "Cookies": {
                "Forward": "none"
            }
        }
    },
    "CacheBehaviors": {
        "Quantity": 2,
        "Items": [
            {
                "PathPattern": "*/thumbnails/*",
                "TargetOriginId": "S3-kan-storage",
                "ViewerProtocolPolicy": "redirect-to-https",
                "MinTTL": 604800,
                "DefaultTTL": 2592000,
                "MaxTTL": 31536000,
                "Compress": true
            },
            {
                "PathPattern": "*/images/*",
                "TargetOriginId": "S3-kan-storage",
                "ViewerProtocolPolicy": "redirect-to-https", 
                "MinTTL": 86400,
                "DefaultTTL": 604800,
                "MaxTTL": 31536000,
                "Compress": true
            }
        ]
    },
    "PriceClass": "PriceClass_100",
    "Enabled": true
}
```

### 2. Image Optimization Headers

Update S3 service to set proper headers:

```typescript
// In S3 upload commands, add:
ContentEncoding: 'gzip', // If applicable
CacheControl: 'public, max-age=31536000', // 1 year for images
ContentDisposition: 'inline', // Display in browser
```

## Migration Strategy

### Phase 1: Non-Breaking Changes
1. ✅ Implement presigned URLs (already done)
2. ✅ Enable thumbnail generation (already done)
3. 🔄 Update CORS configuration
4. 🔄 Add lifecycle rules

### Phase 2: Security Tightening  
1. 🔄 Apply restrictive bucket policy
2. 🔄 Test all functionality
3. 🔄 Monitor for issues

### Phase 3: Performance Enhancement
1. 🔄 Set up CloudFront distribution
2. 🔄 Update application to use CDN URLs
3. 🔄 Implement cache headers

## Monitoring & Validation

### Key Metrics to Monitor
- **Failed Requests**: Should remain at 0 after migration
- **Load Times**: Should improve with CDN
- **Costs**: May increase slightly with CloudFront but offset by reduced S3 requests

### Validation Tests
1. ✅ Presigned URLs work correctly
2. 🔄 Direct S3 URLs are blocked (after policy update)
3. 🔄 CORS allows legitimate requests
4. 🔄 CORS blocks unauthorized origins
5. 🔄 Lifecycle rules clean up old files

## Rollback Plan

If issues arise:
1. **Immediate**: Revert bucket policy to current permissive version
2. **CORS Issues**: Restore original CORS configuration  
3. **CDN Issues**: Update DNS to point directly to S3
4. **Emergency**: Disable CloudFront distribution

## Cost Impact

### Estimated Changes
- **S3 Costs**: Minimal change
- **CloudFront**: ~$1-5/month for typical usage
- **Data Transfer**: Reduced costs due to CDN caching
- **Overall**: Slight increase but improved performance/security

---

**Status**: Ready for implementation  
**Risk Level**: Low (gradual rollout with rollback plan)  
**Expected Benefits**: Enhanced security, better performance, reduced S3 costs