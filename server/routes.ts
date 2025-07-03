import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { generateAiaFile } from "./aia-generator";
import { generateAiaRequestSchema } from "@shared/schema";
import { log } from "./vite";
import multer from 'multer';

const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'extensions' && !file.originalname.endsWith('.aix')) {
      cb(new Error('Only .aix files are allowed for extensions'));
      return;
    }
    if (file.fieldname === 'designImages') {
      const allowedImageTypes = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];
      const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      if (!allowedImageTypes.includes(fileExt)) {
        cb(new Error('Only image files (PNG, JPG, JPEG, GIF, BMP) are allowed for design images'));
        return;
      }
    }
    cb(null, true);
  }
});
export const aiaRouter = Router();

// Middleware for detailed logging
aiaRouter.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  log(`[REQ] ${req.method} ${req.url} - Body: ${JSON.stringify(req.body)}`);
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`[RES] ${req.method} ${req.url} - Status: ${res.statusCode} (${duration}ms)`);
  });
  next();
});

aiaRouter.post("/validate", (req: Request, res: Response) => {
  try {
    generateAiaRequestSchema.parse(req.body);
    res.status(200).json({ valid: true, message: "Configuration is valid" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log(`[VALIDATION_ERROR] Invalid configuration: ${JSON.stringify(error.issues)}`);
      res.status(400).json({ valid: false, message: "Invalid configuration", errors: error.issues });
    } else {
      log(`[UNKNOWN_VALIDATION_ERROR] ${error}`);
      res.status(500).json({ valid: false, message: "An unexpected error occurred during validation" });
    }
  }
});

aiaRouter.post("/generate-aia", upload.fields([
  { name: 'extensions', maxCount: 10 },
  { name: 'designImages', maxCount: 5 }
]), async (req: Request, res: Response) => {
  try {
    // Manually parse boolean fields from the multipart form data
    const processedBody = {
      ...req.body,
      saveConfig: req.body.saveConfig === 'true',
      validateStrict: req.body.validateStrict === 'true',
    };

    const validationResult = generateAiaRequestSchema.safeParse(processedBody);
    if (!validationResult.success) {
      log(`[AIA_GENERATION_ERROR] Invalid request body: ${JSON.stringify(validationResult.error.issues)}`);
      return res.status(400).json({ message: "Invalid request body", errors: validationResult.error.issues });
    }

    const aiaBuffer = await generateAiaFile(validationResult.data, req.files);
    const appName = validationResult.data.projectName || "MyTwoButtonApp";

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${appName}.aia"`);
    res.send(aiaBuffer);

  } catch (error) {
    log(`[AIA_GENERATION_ERROR] Failed to generate AIA file: ${error}`);
    res.status(500).json({ message: "Failed to generate AIA file" });
  }
});