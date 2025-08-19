#!/bin/bash

echo "🔍 Testing S3 Security Policy Implementation"
echo "=========================================="

BUCKET="kan-storage-loveganesh-lv"
REGION="ap-southeast-1"

echo ""
echo "1. Testing bucket policy application..."
aws s3api get-bucket-policy --bucket $BUCKET --region $REGION --output json | jq .

echo ""
echo "2. Testing if direct access is blocked..."
echo "   Trying to access a public object directly (should fail)..."

# Note: You would need to replace this with an actual object path in your bucket
# This should return 403 Forbidden after the policy is applied
echo "   curl -I https://${BUCKET}.s3.${REGION}.amazonaws.com/cards/test/images/test.jpg"
curl -I "https://${BUCKET}.s3.${REGION}.amazonaws.com/cards/test/images/test.jpg" 2>/dev/null | head -1

echo ""
echo "3. Testing presigned URL generation..."
aws s3 presign "s3://${BUCKET}/cards/test/images/test.jpg" --expires-in 3600 --region $REGION

echo ""
echo "✅ If direct access returns 403 and presigned URLs work, the policy is successful!"
echo "🔄 If you see issues, run the rollback command in the main instructions."