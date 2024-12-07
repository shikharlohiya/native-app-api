
// awsS3.js
const S3 = require('aws-sdk/clients/s3');

require('dotenv').config(); // Make sure to install dotenv: npm install dotenv

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY



const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
  bucketName
});

// Add this line to disable SSL certificate verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Upload file to S3
function uploadFile(file, path = '', source = 'public') {
  const fileBuffer = file.buffer;
  source = source === 'private' || source == 'public' ? source : 'public';
  const fileWithPath = path !== '' ? source + '/' + path + '/' + file.originalname : source + '/' + file.originalname;
  const uploadParams = {
    Bucket: bucketName,
    Body: fileBuffer,
    Key: fileWithPath
  };
  return s3.upload(uploadParams).promise();
}

exports.uploadFile = uploadFile;