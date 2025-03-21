import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary
// Replace with your own Cloudinary credentials when deploying
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret',
  secure: true
});

export default cloudinary;

// Helper function to upload image to Cloudinary
export const uploadImage = async (file) => {
  return new Promise((resolve, reject) => {
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'ipl_streaming';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    fetch(`https://api.cloudinary.com/v1_1/${cloudinary.config().cloud_name}/image/upload`, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        reject(data.error);
      } else {
        resolve(data);
      }
    })
    .catch(error => {
      reject(error);
    });
  });
};

// Helper function to upload video to Cloudinary (for streams, highlights)
export const uploadVideo = async (file) => {
  return new Promise((resolve, reject) => {
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'ipl_streaming';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    fetch(`https://api.cloudinary.com/v1_1/${cloudinary.config().cloud_name}/video/upload`, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        reject(data.error);
      } else {
        resolve(data);
      }
    })
    .catch(error => {
      reject(error);
    });
  });
};
