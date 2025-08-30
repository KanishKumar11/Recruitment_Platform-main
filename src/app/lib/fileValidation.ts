// File validation constants and utilities

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  RESUME: 2 * 1024 * 1024, // 2MB for resume files
  ADDITIONAL_DOCUMENT: 2 * 1024 * 1024, // 2MB for additional documents
  PROFILE_PICTURE: 500 * 1024, // 500KB for profile pictures
  COMPANY_PROFILE: 2 * 1024 * 1024, // 2MB for company profiles
} as const;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  RESUME: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    extensions: ['.pdf', '.doc', '.docx'],
    description: 'PDF, DOC, DOCX'
  },
  ADDITIONAL_DOCUMENT: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ],
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'],
    description: 'PDF, DOC, DOCX, TXT, JPG, JPEG, PNG'
  },
  PROFILE_PICTURE: {
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif'],
    description: 'JPG, JPEG, PNG, GIF'
  }
} as const;

// File validation result interface
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileSize?: string;
}

// Utility function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Main file validation function
export function validateFile(
  file: File,
  fileType: keyof typeof FILE_SIZE_LIMITS,
  allowedTypes: keyof typeof ALLOWED_FILE_TYPES
): FileValidationResult {
  const maxSize = FILE_SIZE_LIMITS[fileType];
  const allowedFileTypes = ALLOWED_FILE_TYPES[allowedTypes];

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${formatFileSize(maxSize)}. Current size: ${formatFileSize(file.size)}`,
      fileSize: formatFileSize(file.size)
    };
  }

  // Check file type by extension
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  const isValidExtension = (allowedFileTypes.extensions as readonly string[]).includes(fileExtension);
  
  // Check file type by MIME type
  const isValidMimeType = (allowedFileTypes.mimeTypes as readonly string[]).includes(file.type);

  if (!isValidExtension && !isValidMimeType) {
    return {
      isValid: false,
      error: `File type not supported. Please upload ${allowedFileTypes.description} files.`,
      fileSize: formatFileSize(file.size)
    };
  }

  return {
    isValid: true,
    fileSize: formatFileSize(file.size)
  };
}

// Specific validation functions for common use cases
export function validateResumeFile(file: File): FileValidationResult {
  return validateFile(file, 'RESUME', 'RESUME');
}

export function validateAdditionalDocument(file: File): FileValidationResult {
  return validateFile(file, 'ADDITIONAL_DOCUMENT', 'ADDITIONAL_DOCUMENT');
}

export function validateProfilePicture(file: File): FileValidationResult {
  return validateFile(file, 'PROFILE_PICTURE', 'PROFILE_PICTURE');
}

export function validateCompanyProfile(file: File): FileValidationResult {
  return validateFile(file, 'COMPANY_PROFILE', 'RESUME'); // Same types as resume
}

// Validation for multiple files
export function validateMultipleFiles(
  files: File[],
  fileType: keyof typeof FILE_SIZE_LIMITS,
  allowedTypes: keyof typeof ALLOWED_FILE_TYPES
): { isValid: boolean; errors: string[]; validFiles: File[] } {
  const errors: string[] = [];
  const validFiles: File[] = [];

  files.forEach((file, index) => {
    const validation = validateFile(file, fileType, allowedTypes);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    validFiles
  };
}