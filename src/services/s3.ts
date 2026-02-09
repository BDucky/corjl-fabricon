import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'ap-southeast-1'
const S3_BUCKET = import.meta.env.VITE_S3_BUCKET || ''

const s3Client = new S3Client({
  region: AWS_REGION,
})

export interface UploadOptions {
  contentType?: string
  metadata?: Record<string, string>
}

/**
 * Upload a file to S3
 * @param key S3 object key (path)
 * @param file File or Blob to upload
 * @param options Upload options
 * @returns S3 object key if successful
 */
export const uploadToS3 = async (
  key: string,
  file: File | Blob,
  options: UploadOptions = {}
): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: uint8Array,
    ContentType: options.contentType || 'application/octet-stream',
    Metadata: options.metadata,
  })

  await s3Client.send(command)
  return key
}

/**
 * Upload a canvas as PNG to S3
 * @param canvasElement HTML canvas element
 * @param key S3 object key
 * @returns S3 object key if successful
 */
export const uploadCanvasAsImage = async (
  canvasElement: HTMLCanvasElement,
  key: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    canvasElement.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob'))
          return
        }

        try {
          const objectKey = await uploadToS3(key, blob, {
            contentType: 'image/png',
          })
          resolve(objectKey)
        } catch (error) {
          reject(error)
        }
      },
      'image/png'
    )
  })
}

/**
 * Get a signed URL for accessing an S3 object
 * @param key S3 object key
 * @param expiresIn Expiration time in seconds (default: 3600)
 * @returns Signed URL
 */
export const getSignedDownloadUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Delete an object from S3
 * @param key S3 object key
 */
export const deleteFromS3 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  })

  await s3Client.send(command)
}

/**
 * Build S3 object URL
 * @param key S3 object key
 * @returns S3 public URL
 */
export const getS3ObjectUrl = (key: string): string => {
  return `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`
}
