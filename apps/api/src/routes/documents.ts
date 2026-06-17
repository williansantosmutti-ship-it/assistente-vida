import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { authMiddleware, type AuthRequest } from "../auth.js";
import { env } from "../env.js";
import { prisma } from "../prisma.js";

export const documentsRouter = Router();
documentsRouter.use(authMiddleware);

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

documentsRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const documents = await prisma.document.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ documents });
  } catch (error) {
    next(error);
  }
});

documentsRouter.post("/", upload.single("file"), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Arquivo nao enviado." });
    }

    const document = await prisma.document.create({
      data: {
        userId: req.user!.userId,
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: path.resolve(req.file.path)
      }
    });

    return res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
});
