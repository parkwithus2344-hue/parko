import { Router, Request, Response } from 'express'
import multer from 'multer'
import ImageKit from 'imagekit'
import crypto from 'crypto'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

let ik: ImageKit | null = null
function getIK(): ImageKit {
  if (!ik) {
    ik = new ImageKit({
      publicKey:   process.env.IMAGEKIT_PUBLIC_KEY!,
      privateKey:  process.env.IMAGEKIT_PRIVATE_KEY!,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
    })
  }
  return ik
}

// POST /api/imagekit/upload
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    const ext      = req.file.originalname.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `parkspot_${crypto.randomUUID()}.${ext}`
    const result = await getIK().upload({
      file:             req.file.buffer.toString('base64'),
      fileName,
      folder:           '/parkspot/listings',
      useUniqueFileName: false,
    })

    res.json({ url: result.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    res.status(500).json({ error: message })
  }
})

export default router
