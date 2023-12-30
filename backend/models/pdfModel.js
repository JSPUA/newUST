import mongoose from 'mongoose';

const pdfUploadSchema = new mongoose.Schema({
  pdfFileName: String, 
  title: String, // Add title field
  picture: String, // Assuming the picture is a file path or URL, you can store it as a string
  description: String, // Add description field// You can add more fields as needed to store information related to the PDF file
});

const PDFUpload = mongoose.model('PDFUpload', pdfUploadSchema);

export default PDFUpload;
