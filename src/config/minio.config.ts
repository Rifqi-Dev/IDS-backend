import * as Minio from 'minio'

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  accessKey: process.env.MINIO_ACCESSKEY!,
  secretKey: process.env.MINIO_SECRETKEY!,
})

export default minioClient