import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import Resume from '../models/Resume.model.js';

const router = express.Router();

// Get all resumes for a user
router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  
  // Get resumes from MongoDB sorted by creation date (newest first)
  const userResumes = await Resume.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  // Transform _id to id for frontend compatibility
  const resumes = userResumes.map(resume => ({
    id: resume._id.toString(),
    ...resume,
    _id: undefined
  }));

  res.json({
    success: true,
    data: {
      resumes,
      count: resumes.length
    }
  });
}));

// Get a specific resume
router.get('/:resumeId', verifyToken, asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user.uid;

  const resume = await Resume.findById(resumeId).lean();

  if (!resume) {
    throw new ApiError(404, 'Resume not found');
  }

  if (resume.userId !== userId) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({
    success: true,
    data: {
      id: resume._id.toString(),
      ...resume,
      _id: undefined
    }
  });
}));

// Create a new resume
router.post('/', verifyToken, asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { 
    originalText, 
    enhancedText, 
    jobRole, 
    preferences,
    title 
  } = req.body;

  if (!originalText) {
    throw new ApiError(400, 'Original text is required');
  }

  const newResume = await Resume.create({
    userId,
    originalText,
    enhancedText: enhancedText || null,
    jobRole: jobRole || null,
    preferences: preferences || {},
    title: title || `Resume - ${new Date().toLocaleDateString()}`
  });

  res.status(201).json({
    success: true,
    data: {
      id: newResume._id.toString(),
      userId: newResume.userId,
      originalText: newResume.originalText,
      enhancedText: newResume.enhancedText,
      jobRole: newResume.jobRole,
      preferences: newResume.preferences,
      title: newResume.title,
      pdfUrl: newResume.pdfUrl,
      createdAt: newResume.createdAt,
      lastModified: newResume.lastModified
    }
  });
}));

// Update a resume
router.put('/:resumeId', verifyToken, asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user.uid;
  const updates = req.body;

  const resume = await Resume.findById(resumeId);

  if (!resume) {
    throw new ApiError(404, 'Resume not found');
  }

  if (resume.userId !== userId) {
    throw new ApiError(403, 'Access denied');
  }

  // Fields that can be updated
  const allowedUpdates = [
    'originalText', 
    'enhancedText', 
    'jobRole', 
    'preferences', 
    'title', 
    'pdfUrl'
  ];

  const updateData = {};
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      updateData[key] = updates[key];
    }
  }

  const updatedResume = await Resume.findByIdAndUpdate(
    resumeId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).lean();

  res.json({
    success: true,
    data: {
      id: updatedResume._id.toString(),
      ...updatedResume,
      _id: undefined
    }
  });
}));

// Delete a resume
router.delete('/:resumeId', verifyToken, asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user.uid;

  const resume = await Resume.findById(resumeId);

  if (!resume) {
    throw new ApiError(404, 'Resume not found');
  }

  if (resume.userId !== userId) {
    throw new ApiError(403, 'Access denied');
  }

  await Resume.findByIdAndDelete(resumeId);

  res.json({
    success: true,
    message: 'Resume deleted successfully'
  });
}));

// Download resume as PDF
router.get('/:resumeId/download', verifyToken, asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user.uid;
  const { version = 'enhanced' } = req.query; // 'enhanced' or 'original'

  const resume = await Resume.findById(resumeId).lean();

  if (!resume) {
    throw new ApiError(404, 'Resume not found');
  }

  if (resume.userId !== userId) {
    throw new ApiError(403, 'Access denied');
  }

  const PDFDocument = (await import('pdfkit')).default;
  
  // Get the text content based on version
  const textContent = version === 'enhanced' && resume.enhancedText 
    ? resume.enhancedText 
    : resume.originalText;

  if (!textContent) {
    throw new ApiError(400, 'No content available for download');
  }

  // Create PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  // Set response headers for PDF download
  const filename = `${resume.title || 'resume'}_${version}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Pipe the PDF to the response
  doc.pipe(res);

  // Parse markdown-like content and render to PDF
  const lines = textContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      doc.moveDown(0.5);
      continue;
    }

    // Handle headers (markdown style)
    if (trimmedLine.startsWith('### ')) {
      doc.fontSize(12).font('Helvetica-Bold').text(trimmedLine.replace('### ', ''), { continued: false });
      doc.moveDown(0.3);
    } else if (trimmedLine.startsWith('## ')) {
      doc.fontSize(14).font('Helvetica-Bold').text(trimmedLine.replace('## ', ''), { continued: false });
      doc.moveDown(0.3);
    } else if (trimmedLine.startsWith('# ')) {
      doc.fontSize(18).font('Helvetica-Bold').text(trimmedLine.replace('# ', ''), { continued: false });
      doc.moveDown(0.5);
    } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      // Bold text
      doc.fontSize(11).font('Helvetica-Bold').text(trimmedLine.replace(/\*\*/g, ''), { continued: false });
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      // Bullet points
      doc.fontSize(11).font('Helvetica').text(`• ${trimmedLine.substring(2)}`, { 
        indent: 20,
        continued: false 
      });
    } else if (/^\d+\.\s/.test(trimmedLine)) {
      // Numbered lists
      doc.fontSize(11).font('Helvetica').text(trimmedLine, { 
        indent: 20,
        continued: false 
      });
    } else {
      // Regular text - handle inline bold
      const parts = trimmedLine.split(/(\*\*[^*]+\*\*)/);
      let isFirst = true;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        
        const isLast = i === parts.length - 1;
        
        if (part.startsWith('**') && part.endsWith('**')) {
          doc.fontSize(11).font('Helvetica-Bold').text(part.replace(/\*\*/g, ''), { continued: !isLast });
        } else {
          doc.fontSize(11).font('Helvetica').text(part, { continued: !isLast });
        }
        isFirst = false;
      }
      
      if (isFirst) {
        doc.fontSize(11).font('Helvetica').text(trimmedLine, { continued: false });
      }
    }
  }

  // Finalize PDF
  doc.end();
}));

export default router;
