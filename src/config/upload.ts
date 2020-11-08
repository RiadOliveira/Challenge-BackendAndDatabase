import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

export default {
  storage: multer.diskStorage({
    destination: path.resolve(__dirname, '..', '..', 'tmp'),
    filename(request, file, callback) {
      const hashedName = crypto.randomBytes(10).toString('hex');
      const fileName = `${hashedName}-${file.originalname}`;

      callback(null, fileName);
    },
  }),
};
