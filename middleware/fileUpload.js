const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/doc/bukti_dukung');

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    
    cb(null, 'bukti-' + uniqueSuffix + fileExt);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    'video/mp4',
  ];
  
  console.log('File MIME type:', file.mimetype); 
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Format file tidak didukung: ${file.mimetype}. Gunakan PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, atau format lain yang didukung.`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// middleware handling
//bukti dukung
const uploadBuktiDukung = (req, res, next) => {
  upload.array('bukti_file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: `Error upload file: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: err.message
      });
    }
    next();
  });
};

module.exports = {
  uploadBuktiDukung
};