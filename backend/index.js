import express from "express";
import { PORT, mongoDBURL } from "./config.js";
import mongoose from "mongoose";
import booksRoute from "./routes/booksRoute.js";
import cors from "cors";
import multer from "multer";
import Images from "./models/imageDetail.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import PDFUpload from "./models/pdfModel.js";
import Patient from "./models/patientModel.js";
import bcrypt from 'bcrypt';
import StentRecord from "./models/stentRecordModel.js";
import RemovedStent from "./models/removedStentModel.js";
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import webpush from 'web-push';
import bodyParser from "body-parser";
import Subscription from "./models/subscriptionModel.js";
import Role from "./models/roleModel.js"
import  isBoolean  from "util";
import User from "./models/userModel.js"
import cookieParser from "cookie-parser";
import session from "express-session";
import util from 'util';
import twilio from 'twilio';
const client = twilio('AC507c629296d96052f42a054cbdc59593', '34fa1c1069508097be99a2a839fc6391');

// function sendSMS(res){
//   client.messages
//   .create({
//     body: 'Your stent is expired today. Please go back to meet with the doctor',
//     from: "+12058830221",
//     to: "+601116235068", // Assuming 'mobile' is defined somewhere in your code
//   })
//   .then((message) => {
//     console.log(message.sid);
//     res.status(200).json({ message: " Stent Expired message sent successfully" });
//   })
//   .catch((error) => {
//     console.error(error);
//     res.status(500).json({ message: "Error sending stent expired message" });
//   });
//   }

  

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
    session({
      secret: 'ABC123', // Replace with a strong secret key
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false  } // Set secure to true if your app is served over HTTPS
     
    })
  );

  // app.post('/sendSMS', (req, res) => {
  //   try {
  //     sendSMS(res);
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ message: "Error sending stent expired message" });
  //   }
  // });

  function sendSMS() {
    return new Promise((resolve, reject) => {
      client.messages
        .create({
          body: 'Your stent is expired today. Please go back to meet with the doctor',
          from: "+12058830221",
          to: "+601116235068", // Assuming 'mobile' is defined somewhere in your code
        })
        .then((message) => {
          console.log(message.sid);
          resolve("Stent Expired message sent successfully");
        })
        .catch((error) => {
          console.error(error);
          reject("Error sending stent expired message");
        });
    });
  }
  
  // Express route
  app.post('/sendSMS', async (req, res) => {
    try {
      const result = await sendSMS();
      res.status(200).json({ message: result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error sending stent expired message" });
    }
  });


  async function getPatientPhoneNumbers(patientId) {
    try {
      const patient = await Patient.findById(patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }
  
      const patientMobileNo = patient.mobileNo;
      const nextOfKinMobileNo = patient.nextOfKin ? patient.nextOfKin.mobileNo : null;
  
      return { patientMobileNo, nextOfKinMobileNo };
    } catch (error) {
      console.error('Error getting patient phone numbers:', error);
      throw error;
    }
  }

  async function sendMessage(patientId) {
    try {
      const { patientMobileNo, nextOfKinMobileNo } = await getPatientPhoneNumbers(patientId);
  
      if (patientMobileNo) {
        // Send SMS to patient
        await client.messages.create({
          body: 'Your stent is expired today. Please go back to meet with the doctor',
          from: '+12058830221', // Replace with your Twilio phone number
          to: patientMobileNo,
        });
        console.log('SMS sent to patient:', patientMobileNo);
      }
  
      if (nextOfKinMobileNo) {
        // Send SMS to next of kin
        await client.messages.create({
          body: 'Your relative\'s stent is expired today. Please check on them.',
          from: '+12058830221', // Replace with your Twilio phone number
          to: nextOfKinMobileNo,
        });
        console.log('SMS sent to next of kin:', nextOfKinMobileNo);
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  app.post('/sendMessage/:patientId', async (req, res) => {
    const patientId = req.params.patientId;
  
    try {
      await sendMessage(patientId);
      res.status(200).json({ message: 'Stent expiration messages sent successfully' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Error sending stent expiration messages' });
    }
  });
  
  // Cron schedule
  cron.schedule('52 0 * * *', async () => {
    try {
      // const result = await sendSMS();
      console.log('Stent expiration message sent. Result:', result);
    } catch (error) {
      console.error('Error sending stent expired message. Error:', error);
    }
  });


app.get("/", (request, response) => {
  console.log(request);
  return response.status(234).send("Welcome To MERN Stack Tutorial");
});

app.listen(PORT, () => {
  console.log(`App is listening to port: ${PORT}`);
 //setInterval( checkStentsAndSendNotificationss,1000);
  cron.schedule('25 5 * * *', checkStentsAndSendEmails);
 
   cron.schedule('25 5 * * *', checkStentsAndSendNotificationss);
   
   cron.schedule('00 1 * * *', async () => {
    try {
      const result = await sendSMS();
      console.log('Stent expiration message sent. Result:', result);
    } catch (error) {
      console.error('Error sending stent expired message. Error:', error);
    }
  });

  cron.schedule('0 8 * * *', async () => {
    const patientId = '...'; // Set the patient's ID or use another identifier
    try {
      await sendSMS(patientId);
      console.log('Stent expiration messages sent.');
    } catch (error) {
      console.error('Error sending stent expiration messages:', error);
    }
  });

  // cron.schedule('* * * * *', deleteUnreferencedImages);
  
});


app.use("/books", booksRoute);

const imagesDirectory = path.join(__dirname, "../frontend/public/images");
const pdfDirectory = path.join(__dirname, '../frontend/public/pdf');
const imagesDirectory2 = path.join(__dirname, "../frontend/public/images");
const pdfDirectory2 = path.join(__dirname, '../frontend/public/pdf');

if (!fs.existsSync(imagesDirectory)) {
  fs.mkdirSync(imagesDirectory, { recursive: true });
}

if (!fs.existsSync(pdfDirectory)) {
  fs.mkdirSync(pdfDirectory, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDirectory);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

const upload = multer({ storage: storage });

const listFilesInDirectory = async (dir) => {
  try {
    const files = await fs.readdir(dir);
    return files;
  } catch (error) {
    console.error('Error listing files in directory:', error);
    return [];
  }
};

// Function to check if an image is referenced in the database
const isImageReferencedInDB = async (imageName) => {
  const patient = await Patient.findOne({ profilePic: imageName });
  if (patient) return true;

  const user = await User.findOne({ $or: [{ image: imageName }, { imageSecond: imageName }] });
  if (user) return true;

  const imageDetails = await ImageDetails.findOne({ $or: [{ image: imageName }, { imageSecond: imageName }] });
  if (imageDetails) return true;

  return false;
};

// Function to delete unreferenced images
const deleteUnreferencedImages = async () => {
  try {
    const files = await listFilesInDirectory(imagesDirectory);

    for (const file of files) {
      const isReferenced = await isImageReferencedInDB(file);

      if (!isReferenced) {
        await fs.unlink(path.join(imagesDirectory, file));
        console.log(`Deleted unreferenced image: ${file}`);
      }
    }
  } catch (error) {
    console.log('Error during cleanup:', error);
  }
};


// Schedule the cleanup task to run every day at midnight


const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, pdfDirectory);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

const uploadPDF = multer({ storage: pdfStorage });

const pdfEditStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, pdfDirectory2);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});



const pictureEditStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDirectory2);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

const editPDF = multer({ storage: pdfEditStorage });
const editPicture = multer({ storage: pictureEditStorage });

app.post("/delete",(req,res)=>{
console.log(req.body._id);
User.findByIdAndRemove(req.body._id,(err,data)=>{
  console.log(data);
  fs.unlinkSync(`../frontend/public/images/${data.image}`);

});
res.json({success:true});
});


app.post("/upload-image", upload.fields([{ name: "image", maxCount: 1 }, { name: "imageSecond", maxCount: 1 }]), async (req, res) => {
  const {
    username,
    firstName,
    surname,
    dob,
    icNo,
    gender,
    address,
    mobileNo,
    email,
    hospitalName,
    department,
    position,
    mmcRegistrationNo,
  } = req.body;

  try {
    const imageDetails = new Images({
      image: req.files["image"][0].filename, // Get the first image
      imageSecond: req.files["imageSecond"][0].filename, // Get the second image
      username,
      firstName,
      surname,
      dob,
      icNo,
      gender,
      address,
      mobileNo,
      email,
      hospitalName,
      department,
      position,
      mmcRegistrationNo,
    });

    const savedImage = await imageDetails.save();
    res.json({ image: savedImage.image });
  } catch (err) {
    console.log(err.message);
    res.status(400).send({ message: err.message });
  }
});

app.post('/pdf-upload', uploadPDF.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'title', maxCount: 1 },
  { name: 'picture', maxCount: 1 },
  { name: 'description', maxCount: 1 },
]), async (req, res) => {
  if (!req.files) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  try {
    const pdfFile = req.files['pdfFile'][0].filename;
    const picture = req.files['picture'][0].filename; // Access the 'picture' file

    // Create a new document using the PDFUpload model and save it to the database
    const newPDFUpload = new PDFUpload({
      pdfFileName: pdfFile,
      title: req.body.title,
      picture: picture, // Store the 'picture' filename
      description: req.body.description,
      // Add any other fields and data you want to store in the document
    });

    const savedPDFUpload = await newPDFUpload.save();

    res.json({
      message: 'PDF file uploaded successfully',
      pdfFile: savedPDFUpload.pdfFileName,
      // Add other data from the saved document as needed
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/pdf-upload', async (req, res) => {
  try {
    const pdfUploadData = await PDFUpload.find();
    res.json(pdfUploadData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/pdf-upload/:id', async (req, res) => {
  try {
    const pdfUploadData = await PDFUpload.findById(req.params.id);
    if (!pdfUploadData) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    res.json(pdfUploadData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});


// app.put('/pdf-upload/:id', uploadPDF.fields([
//   { name: 'pdfFile', maxCount: 1 },
//   { name: 'title', maxCount: 1 },
//   { name: 'picture', maxCount: 1 },
//   { name: 'description', maxCount: 1 },
// ]), async (req, res) => {
//   try {
//     const pdfId = req.params.id; // Extract the PDF ID from the route parameter
//     const pdfFile = req.files && req.files['pdfFile'] && req.files['pdfFile'][0] && req.files['pdfFile'][0].filename;
//     const picture = req.files && req.files['picture'] && req.files['picture'][0] && req.files['picture'][0].filename;
//     const { title, description } = req.body;

//     // Check if pdfFile and picture are defined before using them
//     if (!pdfFile || !picture) {
//       return res.status(400).json({ message: 'Missing PDF file or picture' });
//     }

//     // Find the PDF by ID
//     const existingPdf = await PDFUpload.findById(pdfId);

//     if (!existingPdf) {
//       return res.status(404).json({ message: 'PDF not found' });
//     }

//     // Update the fields of the existing PDF
//     existingPdf.pdfFileName = pdfFile;
//     existingPdf.title = title;
//     existingPdf.picture = picture;
//     existingPdf.description = description;

//     // Save the updated PDF
//     const updatedPdf = await existingPdf.save();

//     res.json({ message: 'PDF updated successfully', updatedPdf });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ message: 'Server Error' });
//   }
// });
app.put('/pdf-upload/:id', uploadPDF.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'picture', maxCount: 1 },
  { name: 'title', maxCount: 1 },
  { name: 'description', maxCount: 1 },
]), async (req, res) => {
  try {
    const pdfId = req.params.id;
    const pdfUpload = await PDFUpload.findById(pdfId);

    if (!pdfUpload) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    // Delete old files if they exist
    if (pdfUpload.pdfFileName && fs.existsSync(path.join(pdfDirectory, pdfUpload.pdfFileName))) {
      fs.unlinkSync(path.join(pdfDirectory, pdfUpload.pdfFileName));
    }
    if (pdfUpload.picture && fs.existsSync(path.join(pdfDirectory, pdfUpload.picture))) {
      fs.unlinkSync(path.join(pdfDirectory, pdfUpload.picture));
    }

    // Update with new files if they are uploaded
    if (req.files['pdfFile']) {
      pdfUpload.pdfFileName = req.files['pdfFile'][0].filename;
    }
    if (req.files['picture']) {
      pdfUpload.picture = req.files['picture'][0].filename;
    }

    pdfUpload.title = req.body.title || pdfUpload.title;
    pdfUpload.description = req.body.description || pdfUpload.description;

    const updatedPdf = await pdfUpload.save();
    res.json({ message: 'PDF updated successfully', updatedPdf });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});





// app.delete('/pdf-upload/:id', async (req, res) => {
//   try {
//     const pdfUploadData = await PDFUpload.findByIdAndDelete(req.params.id);

//     if (!pdfUploadData) {
//       return res.status(404).json({ message: 'PDF not found' });
//     }

//     res.json({ message: 'PDF deleted successfully' });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ message: 'Server Error' });
//   }
// });

app.delete('/pdf-upload/:id', async (req, res) => {
  try {
    const pdfId = req.params.id;
    const pdfUploadData = await PDFUpload.findById(pdfId);

    if (!pdfUploadData) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    // Delete the PDF file if it exists
    if (pdfUploadData.pdfFileName && fs.existsSync(path.join(pdfDirectory, pdfUploadData.pdfFileName))) {
      fs.unlinkSync(path.join(pdfDirectory, pdfUploadData.pdfFileName));
    }

    // Delete the picture file if it exists
    if (pdfUploadData.picture && fs.existsSync(path.join(pdfDirectory, pdfUploadData.picture))) {
      fs.unlinkSync(path.join(pdfDirectory, pdfUploadData.picture));
    }

    // Now delete the document from the database
    await PDFUpload.findByIdAndDelete(pdfId);

    res.json({ message: 'PDF and associated files deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get("/get-image", async (req, res) => {
  try {
    const images = await Images.find({}, "image imageSecond username firstName surname dob icNo gender address mobileNo email hospitalName department position mmcRegistrationNo");
    res.json({ data: images });
  } catch (err) {
    console.log(err.message);
    res.status(400).send({ message: err.message });
  }
});

app.get("/get-image/:id", async (req, res) => {
  try {
    const imageId = req.params.id;

    // Assuming "Images" is your Mongoose model
    const image = await Images.findById(imageId);

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // You can choose which fields to include in the response
    const responseData = {
      image: image.image,
      imageSecond: image.imageSecond,
      username: image.username,
      firstName: image.firstName,
      surname: image.surname,
      dob: image.dob,
      icNo: image.icNo,
      gender: image.gender,
      address: image.address,
      mobileNo: image.mobileNo,
      email: image.email,
      hospitalName: image.hospitalName,
      department: image.department,
      position: image.position,
      mmcRegistrationNo: image.mmcRegistrationNo,
    };

    res.json(responseData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ message: "Server Error" });
  }
});

app.delete("/get-image/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Images.findById(id);
    if (!result) {
      return res.status(404).json({ message: "Apply user not found" });
    }
    const imagePath = path.join(imagesDirectory, result.image);
    const imageSecondPath = path.join(imagesDirectory, result.imageSecond);

    // Check if files exist and delete them
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    if (fs.existsSync(imageSecondPath)) {
      fs.unlinkSync(imageSecondPath);
    }
    await Images.findByIdAndDelete(id);
    return res.status(200).send({ message: "Applying user deleted successfully" });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

app.post('/addUser/:id', async (req, res) => {
  const applicationId = req.params.id;

  try {
    // Retrieve the application details from the database using the ID
    const application = await Images.findById(applicationId);

    // Create a new User instance with the relevant information from the application
    const newUser = new User({
      username: application.username,
      image: application.image,
      imageSecond: application.imageSecond,
      firstName: application.firstName,
      surname: application.surname,
      dob: application.dob,
      icNo: application.icNo,
      gender: application.gender,
      address: application.address,
      mobileNo: application.mobileNo,
      email: application.email,
      hospitalName: application.hospitalName,
      department: application.department,
      position: application.position,
      mmcRegistrationNo: application.mmcRegistrationNo,
    });

    // Save the new user to the User collection
    const savedUser = await newUser.save();

    // Optionally, you can delete the application after adding the new user
    await Images.findByIdAndDelete(applicationId);

    res.status(200).json({ success: true, user: savedUser });
  } catch (error) {
    console.error('Error adding new user:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

//patient profile
app.post('/addPatients', async (req, res) => {
  const {
    firstName,
    surname,
    dob,
    mrnNo,
    icNo,
    gender,
    mobileNo,
    email,
    ethnicity,
    password,
    nextOfKinFirstName,
    nextOfKinSurname,
    nextOfKinMobileNo,
  } = req.body;

  try {
    // Hash the password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const patient = new Patient({
      firstName,
      surname,
      dob,
      mrnNo,
      icNo,
      gender,
      mobileNo,
      email,
      ethnicity,
      password: hashedPassword, // Store the hashed password
      nextOfKin: {
        firstName: nextOfKinFirstName,
        surname: nextOfKinSurname,
        mobileNo: nextOfKinMobileNo,
      },
    });

    const savedPatient = await patient.save();
    res.json({ patient: savedPatient });
  } catch (err) {
    console.log(err.message);
    res.status(400).send({ message: err.message });
  }
});



app.get('/getPatients', async (req, res) => {
  try {
    // Assuming you have a model named "Patient" for patient data
    const patients = await Patient.find();

    res.json({ patients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/getLastMrnNo', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ mrnNo: -1 }).limit(1);

    const lastMrnNo = patients.length > 0 ? patients[0].mrnNo : 0;
    res.json({ lastMrnNo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/getPatientById/:id', async (req, res) => {
  try {
    const patientId = req.params.id;

    // Assuming you have a model named "Patient" for patient data
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ patient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.delete('/deletePatient/:id', async (req, res) => {
  try {
    // Extract the patient's ID from the request parameters
    const patientId = req.params.id;

    // Check if the patient exists
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patient.profilePic) {
      const profilePicPath = path.join(imagesDirectory, patient.profilePic);
      if (fs.existsSync(profilePicPath)) {
        fs.unlinkSync(profilePicPath);
      }
    }
    await Patient.findByIdAndDelete(patientId);


    // If the patient exists, delete them
   

    res.json({ message: 'Patient deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.delete('/deleteStent/:id/:stentIndex', async (req, res) => {
  try {
    const patientId = req.params.id;
    const stentIndex = parseInt(req.params.stentIndex);

    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (stentIndex < 0 || stentIndex >= patient.stentData.length) {
      return res.status(400).json({ message: 'Invalid stent index' });
    }

    // Remove the stent record from the array based on the index
    patient.stentData.splice(stentIndex, 1);

    // Save the updated patient data
    await patient.save();

    res.json({ message: 'Stent record deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.put('/updateStent/:id/:stentIndex', async (req, res) => {
  try {
    const patientId = req.params.id;
    const stentIndex = parseInt(req.params.stentIndex);
    const updatedStentData = req.body; // The updated stent data sent in the request body

    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (stentIndex < 0 || stentIndex >= patient.stentData.length) {
      return res.status(400).json({ message: 'Invalid stent index' });
    }

    // Update the stent record based on the index
    patient.stentData[stentIndex] = updatedStentData;

    // Save the updated patient data
    await patient.save();

    res.json({ message: 'Stent record updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.get('/getStent/:id/:stentIndex', async (req, res) => {
  try {
    const patientId = req.params.id;
    const stentIndex = parseInt(req.params.stentIndex);

    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (stentIndex < 0 || stentIndex >= patient.stentData.length) {
      return res.status(400).json({ message: 'Invalid stent index' });
    }

    // Retrieve the stent record based on the index
    const stentRecord = patient.stentData[stentIndex];

    res.json(stentRecord);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



app.put('/updatePatient/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    const updateData = req.body; // The updated data is expected in the request body

    // Assuming you have a model named "Patient" for patient data
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Update the patient's information with the data from the request body
    patient.firstName = updateData.firstName;
    patient.surname = updateData.surname;
    patient.dob = updateData.dob;
    patient.mrnNo = updateData.mrnNo;
    patient.icNo = updateData.icNo;
    patient.gender = updateData.gender;
    patient.mobileNo = updateData.mobileNo;
    patient.email = updateData.email;
    patient.ethnicity = updateData.ethnicity;

    // Update nextOfKin data
    patient.nextOfKin.firstName = updateData.nextOfKin.firstName;
    patient.nextOfKin.surname = updateData.nextOfKin.surname;
    patient.nextOfKin.mobileNo = updateData.nextOfKin.mobileNo;

    // Save the updated patient data
    await patient.save();

    res.json({ message: 'Patient updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.put('/updateStentData/:id', async (req, res) => {
  const patientId = req.params.id;
  const updatedStentData = req.body; // New stent data to update

  try {
    // Find the patient by MRN No
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Update the patient's stentData
    patient.stentData = updatedStentData;

    // Save the updated patient
    const updatedPatient = await patient.save();
    res.status(200).json(updatedPatient.stentData);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});






app.post('/stentRecords', async (req, res) => {
  try {
    const { mrnNo, stentData } = req.body;

    // Find the patient by MRN No
    const patient = await Patient.findOne({ mrnNo });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Extract patient data
    const { firstName, surname, icNo, mobileNo,email } = patient;

    // Create a new stent record based on the request body and associated patient data
    const newStentRecord = new StentRecord({
      mrnNo,
      icNo,
      firstName,
      surname,
      mobileNo,
      email,
      stentData, // Array of stent data
    });

    // Save the new stent record to the database
    const savedStentRecord = await newStentRecord.save();

    res.status(201).json(savedStentRecord);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/stentRecords', async (req, res) => {
  try {
    // Retrieve all stent records
    const allStentRecords = await StentRecord.find();
    res.status(200).json(allStentRecords);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/stents/:id', async (req, res) => {
  try {
    const patientId = req.params.id; // Access the patient's ID from the URL

    // Find the patient by ID
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create a new stent object
    const newStentData = {
      caseId: req.body.caseId,
      mrnNo: req.body.mrnNo,
      laterality: req.body.laterality,
      hospitalName: req.body.hospitalName,
      insertedDate: req.body.insertedDate,


     
      mrnNo:req.body.mrnNo,
     
       dueDate: req.body.dueDate,
       size: req.body.size,
       length: req.body.length,
      
       stentBrand: req.body.stentBrand,
       placeOfInsertion: req.body.placeOfInsertion,
       remarks: req.body.remarks,
      // Add other stent properties here
    };

    if (req.body.stentType === 'others') {
      // If stentType is 'others', use stentTypeOther as the value
      newStentData.stentType = req.body.stentTypeOther;
    } else {
      // Use the selected stentType from the list
      newStentData.stentType = req.body.stentType;
    }

    // Add the new stent to the stentData array
    patient.stentData.push(newStentData);

    // Save the updated patient with the new stent
    await patient.save();

    res.status(201).json(newStentData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/removedStents/:patientId', async (req, res) => {
  const patientId = req.params.patientId;
  const removedStentInfo = req.body;

  try {
    // Create a new removed stent document using the Mongoose model
    const newRemovedStent = new RemovedStent({
      ...removedStentInfo,
      patientId,
    });

    // Save the removed stent document to the database
    await newRemovedStent.save();

    // Respond with a success message or the newly added stent information
    res.status(201).json({ message: 'Removed Stent added successfully', data: newRemovedStent });
  } catch (error) {
    // Handle any errors that occur during the save process
    res.status(500).json({ error: 'Failed to add removed stent', details: error.message });
  }
});


app.post('/send-email', async (req, res) => {

  let transporter = nodemailer.createTransport({
    // Configure your mail server settings
    service: 'gmail', // if you are using Gmail
    auth: {
      user: 'puajingsheng2001@gmail.com',
      pass: 'kdvx yeym tnhx cgxy', // It's recommended to use environment variables or OAuth2 for security
    },
    tls: {
      rejectUnauthorized: false // only use this for self-signed certs
    }
  });

  let mailOptions = {
    from: 'puajingsheng2001@gmail.com',
    to: req.body.email, // The recipient email address
    subject: req.body.subject,
    text: req.body.text, // and/or html: req.body.html for HTML emails
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    res.json({ message: 'Email sent', info: info });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Failed to send email', error: error });
  }
});

let transporter = nodemailer.createTransport({
  service: 'gmail', // e.g., 'gmail'
  auth: {
    user: 'puajingsheng2001@gmail.com',//process.env.EMAIL_USERNAME
    pass: 'kdvx yeym tnhx cgxy', // process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false // only use this for self-signed certs
  }

});

const calculateDueDate = (insertedDate, dueIn) => {
  if (!insertedDate) {
    return '';
  }

  // Convert the dueIn value to the number of days
  let days = 0;
  switch (dueIn) {
    case '2 weeks':
      days = 14;
      break;
    case '1 month':
      days = 30;
      break;
    case '2 months':
      days = 60;
      break;
    case '3 months':
      days = 90;
      break;
    case '6 months':
      days = 180;
      break;
    case '12 months':
      days = 365; // Approximated to 365 days for a year
      break;
    case 'permanent':
      days = 0;
      break;
    default:
      days = 0;
  }

  // Calculate the due date by adding the number of days to the inserted date
  const insertedDateTime = new Date(insertedDate).getTime();
  const dueDateTime = new Date(insertedDateTime + days * 24 * 60 * 60 * 1000);
  const formattedDueDate = dueDateTime.toISOString().split('T')[0];

  return formattedDueDate;
};
const checkStentsAndSendEmails = async () => {
  try {
    const patients = await Patient.find({ 'stentData': { $exists: true, $not: { $size: 0 } } });

    for (const patient of patients) {
      for (let stent of patient.stentData) {
        const dueDate = calculateDueDate(stent.insertedDate, stent.dueDate);
        const timeDiff = new Date(dueDate).getTime() - new Date().getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if ((daysLeft === 14 && !stent.notificationSent.fourteenDayWarning) ||
            (daysLeft === 0 && !stent.notificationSent.expired)) {
          const subject = daysLeft === 14 ? 'Stent Due Soon' : 'Stent is Expired';
          const message = daysLeft === 14 
            ? 'Your stent will be due soon. Please schedule a checkup.' 
            : 'Your stent is expired. Please contact us immediately.';
          
          let mailOptions = {
            from: 'puajingsheng2001@gmail.com',
            to: patient.email, 
            subject: subject,
            text: message,
          };

          try {
            await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${patient.email} about ${subject}`);

            // Update notification sent status
            if (daysLeft === 14) {
              stent.notificationSent.fourteenDayWarning = true;
            } else if (daysLeft === 0) {
              stent.notificationSent.expired = true;
            }
            await patient.save(); // Save the patient with updated stent data
          } catch (emailError) {
            console.error('Failed to send email:', emailError);
          }
        }
        else if(stent.notificationSent.fourteenDayWarning){
          console.log(`${patient.firstName} Stent due email send already`);
        }
        else if(stent.notificationSent.expired){
          console.log(`${patient.firstName} Stent expired email send already`);
        }
        else{
          console.log(`${patient.firstName} Not yet`);
        }
       
      }
    }
  } catch (err) {
    console.error('Error in checkStentsAndSendEmails:', err);
  }
};

// app.use(express.static('public'));

// app.get('/pushNoti', function(req, res) {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });


const publicVapidKey =
  "BH009TIykrF5IwMRCR0fjSrCotnMkOZY3Ahag7ZpzewDMSjml9DYaW4-uX8N7H3ljZP_Y_VhyyjmiSk0HKv-J94";
const privateVapidKey = "KeKJT8QJvbf-lxY40gTGaUWRZ51RyYB5lwp1ZMSBVXs";

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  publicVapidKey,
  privateVapidKey
);

app.post('/subscribe', async (req, res) => {
  const subscription = new Subscription(req.body); // create a new instance with the request body

  try {
    await subscription.save(); // save the subscription to the database
    res.status(201).json({ message: 'Subscription saved' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save subscription', error });
  }
});



// Call the function to unsubscribe


const getSubscriptionsFromDatabase = async () => {
  try {
    return await Subscription.find({});
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
};

// const checkStentsAndSendNotifications = async () => {
//   try {
//     const patients = await Patient.find({ 'stentData': { $exists: true, $not: { $size: 0 } } });

//     for (const patient of patients) {
//       for (let stent of patient.stentData) {
//         const dueDate = calculateDueDate(stent.insertedDate, stent.dueDate);
//         const timeDiff = new Date(dueDate).getTime() - new Date().getTime();
//         const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

//         if ((daysLeft === 14 && !stent.notificationSent.fourteenDayWarning) ||
//             (daysLeft === 0 && !stent.notificationSent.expired)) {
//           const notificationPayload = JSON.stringify({
//             title: daysLeft === 14 ? 'Stent Due Soon' : 'Stent is Expired',
//             body: daysLeft === 14 ? 'Your stent will be due soon. Please schedule a checkup.' : 'Your stent is expired. Please contact us immediately.'
//           });

//           // Send a push message to each subscription
//           const subscriptions = await getSubscriptionsFromDatabase(); // Implement this function
//           subscriptions.forEach(subscription => {
//             webpush.sendNotification(subscription, notificationPayload)
//               .catch(error => console.error('Error sending push notification:', error));
//           });

//           // Update notification sent status
//           if (daysLeft === 14) {
//             stent.notificationSent.fourteenDayWarning = true;
//           } else if (daysLeft === 0) {
//             stent.notificationSent.expired = true;
//           }
//           await patient.save(); // Save the patient with updated stent data
//         }
//         else if(daysLeft>10){
//           const notificationPayload = JSON.stringify({
//             title: daysLeft === 14 ? 'Stent Due Soon' : 'Stent is Expired',
//             body: daysLeft === 14 ? 'Your stent will be due soon. Please schedule a checkup.' : 'Your stent is expired. Please contact us immediately.'
//           });

//           // Send a push message to each subscription
//           const subscriptions = await getSubscriptionsFromDatabase(); // Implement this function
//           subscriptions.forEach(subscription => {
//             webpush.sendNotification(subscription, notificationPayload)
//               .catch(error => console.error('Error sending push notification:', error));
//           });

//           // Update notification sent status
//           if (daysLeft === 14) {
//             stent.notificationSent.fourteenDayWarning = true;
//           } else if (daysLeft === 0) {
//             stent.notificationSent.expired = true;
//           }
//           await patient.save();
//         }
//       }
//     }
//   } catch (err) {
//     console.error('Error in checkStentsAndSendNotifications:', err);
//   }
// };
const checkStentsAndSendNotificationss = async () => {
  try {
    const patients = await Patient.find({ 'stentData': { $exists: true, $not: { $size: 0 } } });
    const subscriptions = await getSubscriptionsFromDatabase();

    for (const patient of patients) {
      for (const stent of patient.stentData) {
        const dueDate = calculateDueDate(stent.insertedDate, stent.dueDate);
        const timeDiff = new Date(dueDate).getTime() - new Date().getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if ((daysLeft === 14 && !stent.notificationSent.fourteenDayWarning) ||
            (daysLeft === 0 && !stent.notificationSent.expired)) {
          const notificationPayload = JSON.stringify({
            title: daysLeft === 14 ? 'Stent Due Soon' : 'Stent is Expired',
            body: daysLeft === 14 
              ? `Your stent will be due soon. Please schedule a checkup for ${patient.firstName} ${patient.surname}.` 
              : `Your stent is expired for ${patient.firstName} ${patient.surname}. Please contact us immediately.`,
            icon: 'https://i.ibb.co/Chqt5S0/4.png'
          });

          subscriptions.forEach(subscription => {
            webpush.sendNotification(subscription, notificationPayload)
              .catch(error => console.error('Error sending push notification:', error));
          });

          // Update notification sent status in your database here
          if (daysLeft === 14) {
            stent.notificationSent.fourteenDayWarning = true;
           console.log(`${patient.firstname} due soon`);
          } else if (daysLeft === 0) {
            stent.notificationSent.expired = true;
              console.log(`${patient.firstname} epxired today`);
          }
          await patient.save(); // Save the patient with updated stent data
        }
        else if(stent.notificationSent.fourteenDayWarning){
          console.log(`${patient.firstName} Stent due noti send already`);
        }
        else if(stent.notificationSent.expired){
          console.log(`${patient.firstName} Stent expired noti send already`);
        }
        else{
          console.log(`${patient.firstName} Not yet`);
        }
      }
    }
  } catch (err) {
    console.error('Error in checkStentsAndSendNotifications:', err);
  }
};

const checkStentsAndSendNotifications = async () => {
  // Retrieve all subscription objects from the database
  const subscriptions = await getSubscriptionsFromDatabase();
  
  // Construct your notification payload. This is just an example payload.
  const notificationPayload = JSON.stringify({
    title: 'Stent Reminder',
    body: 'This is a reminder to check your stent.',
    icon: 'https://i.ibb.co/Chqt5S0/4.png'
  });

  // Send a notification to each subscription
  subscriptions.forEach(subscription => {
    webpush.sendNotification(subscription, notificationPayload)
      .catch(error => console.error('Error sending push notification:', error));
  });
};


app.get('/role', async (req, res) => {
  try {
      // Fetch all roles from the database
      const roles = await Role.find();

      // Send the roles data as a response
      res.status(200).json(roles);
  } catch (error) {
      // Send an error response if something goes wrong
      res.status(500).send('Error fetching roles: ' + error.message);
  }
});

app.get('/permissions', async (req, res) => {
  try {
      // Assuming permissions are stored in an array field named 'permissions' in the Role model
      const allPermissions = await Role.distinct('permissions');
      
      // Send the unique permissions as a response
      res.status(200).json(allPermissions);
  } catch (error) {
      // Send an error response if something goes wrong
      res.status(500).send('Error fetching permissions: ' + error.message);
  }
});


app.post('/role', async (req, res) => {
  const { name, permissions } = req.body;

  // Validate the input data
  if (!name || !permissions || !Array.isArray(permissions)) {
      return res.status(400).send('Invalid data format');
  }

  try {
      // Create a new role instance
      const newRole = new Role({ name, permissions });

      // Save the new role to the database
      await newRole.save();

      // Send a response back to the client
      res.status(201).send(`Role ${name} with permissions ${permissions.join(', ')} added successfully`);
  } catch (error) {
      // Send an error response if something goes wrong
      res.status(500).send('Error saving the role: ' + error.message);
  }
});

app.put('/role', async (req, res) => {
  const { name, permissions } = req.body;

  // Validate the input data
  if (!name || !permissions || !Array.isArray(permissions)) {
      return res.status(400).send('Invalid data format');
  }

  try {
      // Find the role by name and update its permissions
      const updatedRole = await Role.findOneAndUpdate(
          { name: name },
          { $set: { permissions: permissions } },
          { new: true } // This option returns the updated document
      );

      // Check if the role was found and updated
      if (!updatedRole) {
          return res.status(404).send('Role not found');
      }

      // Send a response back to the client
      res.status(200).send(`Role ${name} updated with permissions ${permissions.join(', ')}`);
  } catch (error) {
      // Send an error response if something goes wrong
      res.status(500).send('Error updating the role: ' + error.message);
  }
});


//new
app.get('/getPatientByEmail/:icNo', async (req, res) => {
  try {
    const patientIcNo = req.params.icNo;
    const patient = await Patient.findOne({ icNo: patientIcNo });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ patient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/getStaffByEmail/:icNo', async (req, res) => {
  try {
    const staffIcNo = req.params.icNo;
    const staff = await User.findOne({ icNo: staffIcNo });

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json({ staff });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/login', async (req, res) => {
  const { icNo, password } = req.body;

  try {
    const user = await Patient.findOne({ icNo });
    const hashedPassword = user ? user.password : null;

    // Check if the user exists and the password matches
    if (!user || !(await bcrypt.compare(password, hashedPassword))) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }
    req.session.userId = user.id;
    console.log(req.session.userId);
    // Include the patient email in the response
    res.json({ success: true, icNo: user.icNo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.post('/staffLogin', async (req, res) => {
const { icNo, password } = req.body;

try {
  const user = await User.findOne({ icNo });
  const hashedPassword = user ? user.password : null;

  // Check if the user exists and the password matches
  if (!user || !(await bcrypt.compare(password, hashedPassword))) {
    return res.json({ success: false, message: 'Invalid IC No or password' });
  }
  req.session.userId = user.id;
  console.log(req.session.userId);
  // Include the user's IC No in the response
  res.json({ success: true, icNo: user.icNo });
} catch (error) {
  res.status(500).json({ success: false, message: 'Internal Server Error' });
  console.log(error)
}
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    console.log("success delete cookie")
    res.json({ success: true, message: 'Logout successful' });
  });
});

app.get('/role/:name', async (req, res) => {
  const roleName = req.params.name;

  try {
    // Find the role in the database by name
    const role = await Role.findOne({ name: roleName });

    // Check if the role was found
    if (!role) {
      return res.status(404).send(`Role with name ${roleName} not found`);
    }

    // Send the role information as a response
    res.status(200).json({ name: role.name, permissions: role.permissions });
  } catch (error) {
    // Send an error response if something goes wrong
    res.status(500).send('Error retrieving role information: ' + error.message);
  }
});

app.get('/users', async (req, res) => {
  try {
      // Fetch all roles from the database
      const users = await User.find();

      // Send the roles data as a response
      res.status(200).json(users);
  } catch (error) {
      // Send an error response if something goes wrong
      res.status(500).send('Error fetching users ' + error.message);
  }
});

app.get("/hospitals", async (req, res) => {
  try {
    const uniqueHospitals = await User.distinct("hospitalName");

    res.json({ hospitals: uniqueHospitals });
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/hospitalsP", async (req, res) => {
  try {
    // Use dot notation to access the nested field
    const uniqueHospitals = await Patient.distinct("stentData.hospitalName");

    res.json({ hospitals: uniqueHospitals });
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/hospitalsP/:hospitalName/patients", async (req, res) => {
  try {
    const hospitalName = req.params.hospitalName;

    // Find all patients with the specified hospitalName
    const patients = await Patient.find({ 'stentData.hospitalName': hospitalName });

    res.json({ patients: patients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/users/:hospitalName", async (req, res) => {
  try {
    const hospitalName = req.params.hospitalName;

    // Find all patients with the specified hospitalName
    const users = await User.find({ 'hospitalName': hospitalName });

    res.json({ users: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/application/:hospitalName", async (req, res) => {
  try {
    const hospitalName = req.params.hospitalName;

    // Find all patients with the specified hospitalName
    const applications = await Images.find({ 'hospitalName': hospitalName });

    res.json({ applications: applications });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Assuming "Images" is your Mongoose model
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // You can choose which fields to include in the response
    const responseData = {
      image: user.image,
      imageSecond: user.imageSecond,
      username: user.username,
      firstName: user.firstName,
      surname: user.surname,
      dob: user.dob,
      icNo: user.icNo,
      gender: user.gender,
      address: user.address,
      mobileNo: user.mobileNo,
      email: user.email,
      hospitalName: user.hospitalName,
      department: user.department,
      position: user.position,
      mmcRegistrationNo: user.mmcRegistrationNo,
    };

    res.json(responseData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ message: "Server Error" });
  }
});

app.delete("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.image) {
      const imagePath = path.join(imagesDirectory, user.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    if (user.imageSecond) {
      const imageSecondPath = path.join(imagesDirectory, user.imageSecond);
      if (fs.existsSync(imageSecondPath)) {
        fs.unlinkSync(imageSecondPath);
      }
    }
    await User.findByIdAndDelete(id);
    return res.status(200).send({ message: "User deleted successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// app.put('/updateUser/:id', async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const updateData = req.body; // The updated data is expected in the request body

//     // Assuming you have a model named "Patient" for patient data
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: 'Patient not found' });
//     }

//     // Update the patient's information with the data from the request body
//     user.username = updateData.username;
//     user.firstName = updateData.firstName;
//     user.surname = updateData.surname;
//     user.dob = updateData.dob;
//     user.icNo = updateData.icNo;
//     user.gender = updateData.gender;
//     user.address = updateData.address;
//     user.mobileNo = updateData.mobileNo;
//     user.email = updateData.email;
//     user.hospitalName = updateData.hospitalName;
//     user.department = updateData.department;
//     user.position = updateData.position;
//     user.mmcRegistrationNo = updateData.mmcRegistrationNo;
//     user.image = updateData.image;
     
    

//     // Save the updated patient data
//     await user.save();

//     res.json({ message: 'User updated successfully' });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

// app.put('/updateUser/:id', async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const updateData = req.body;

//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Update the user's information with the data from the request body
//     if (updateData.username) user.username = updateData.username;
//     if (updateData.firstName) user.firstName = updateData.firstName;
//     if (updateData.surname) user.surname = updateData.surname;
//     if (updateData.dob) user.dob = updateData.dob;
//     if (updateData.icNo) user.icNo = updateData.icNo;
//     if (updateData.gender) user.gender = updateData.gender;
//     if (updateData.address) user.address = updateData.address;
//     if (updateData.mobileNo) user.mobileNo = updateData.mobileNo;
//     if (updateData.email) user.email = updateData.email;
//     if (updateData.hospitalName) user.hospitalName = updateData.hospitalName;
//     if (updateData.department) user.department = updateData.department;
//     if (updateData.position) user.position = updateData.position;
//     if (updateData.mmcRegistrationNo) user.mmcRegistrationNo = updateData.mmcRegistrationNo;
//     if (updateData.image) user.image = updateData.image;

//     // Save the updated user data
//     await user.save();

//     res.json({ message: 'User updated successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

app.put("/user/:id", upload.fields([
  {name: 'image',maxCount: 1},
  {name: 'imageSecond',maxCount: 1},
]), async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    //const image = req.files && req.files['image'] && req.files['image'][0] && req.files['image'][0].filename;
    //const imageSecond = req.files && req.files['imageSecond'] && req.files['imageSecond'][0] && req.files['imageSecond'][0].filename;

   
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.files && req.files['image']) {
      if (user.image) {
        const existingImagePath = path.join(imagesDirectory, user.image);
        if (fs.existsSync(existingImagePath)) {
          fs.unlinkSync(existingImagePath);
        }
      }
      user.image = req.files['image'][0].filename;
    }

    // Delete old 'imageSecond' if a new one is uploaded
    if (req.files && req.files['imageSecond']) {
      if (user.imageSecond) {
        const existingImageSecondPath = path.join(imagesDirectory, user.imageSecond);
        if (fs.existsSync(existingImageSecondPath)) {
          fs.unlinkSync(existingImageSecondPath);
        }
      }
      user.imageSecond = req.files['imageSecond'][0].filename;
    }

    // Update the user's information with the data from the request body
    if (updateData.username) user.username = updateData.username;
    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.surname) user.surname = updateData.surname;
    if (updateData.dob) user.dob = updateData.dob;
    if (updateData.icNo) user.icNo = updateData.icNo;
    if (updateData.gender) user.gender = updateData.gender;
    if (updateData.address) user.address = updateData.address;
    if (updateData.mobileNo) user.mobileNo = updateData.mobileNo;
    if (updateData.email) user.email = updateData.email;
    if (updateData.hospitalName) user.hospitalName = updateData.hospitalName;
    if (updateData.department) user.department = updateData.department;
    if (updateData.position) user.position = updateData.position;
    if (updateData.mmcRegistrationNo) user.mmcRegistrationNo = updateData.mmcRegistrationNo;
    if (updateData.image) user.image = updateData.image;
    if (updateData.imageSecond) user.imageSecond = updateData.imageSecond;
    // Save the updated user data
    await user.save();

    // You can choose which fields to include in the response
    const responseData = {
      image: user.image,
      imageSecond: user.imageSecond,
      username: user.username,
      firstName: user.firstName,
      surname: user.surname,
      dob: user.dob,
      icNo: user.icNo,
      gender: user.gender,
      address: user.address,
      mobileNo: user.mobileNo,
      email: user.email,
      hospitalName: user.hospitalName,
      department: user.department,
      position: user.position,
      mmcRegistrationNo: user.mmcRegistrationNo,
    };

    res.json(responseData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ message: "Server Error" });
  }
});


app.get('/getStaffInfo/:icNo', async (req, res) => {
  try {
    const staffIcNo = req.params.icNo;
    const staff = await User.findOne({ icNo: staffIcNo });

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json({ staff });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.put('/updateStaffInfo/:icNo', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'imageSecond', maxCount: 1 },
]), async (req, res) => {
  try {
    const staffIcNo = req.params.icNo;
    const updateData = req.body;

    // Check if 'image' and 'imageSecond' fields are present in the request files
    

    // Find staff by icNo
    const staff = await User.findOne({ icNo: staffIcNo });

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    if (req.files && req.files['image']) {
      if (staff.image) {
        const existingImagePath = path.join(imagesDirectory, staff.image);
        if (fs.existsSync(existingImagePath)) {
          fs.unlinkSync(existingImagePath);
        }
      }
      staff.image = req.files['image'][0].filename;
    }

    // Check and update 'imageSecond'
    if (req.files && req.files['imageSecond']) {
      if (staff.imageSecond) {
        const existingImageSecondPath = path.join(imagesDirectory, staff.imageSecond);
        if (fs.existsSync(existingImageSecondPath)) {
          fs.unlinkSync(existingImageSecondPath);
        }
      }
      staff.imageSecond = req.files['imageSecond'][0].filename;
    }


    // Update staff's information with the data from the request body
    if (updateData.username) staff.username = updateData.username;
    if (updateData.firstName) staff.firstName = updateData.firstName;
    if (updateData.surname) staff.surname = updateData.surname;
    if (updateData.dob) staff.dob = updateData.dob;
    if (updateData.icNo) staff.icNo = updateData.icNo;
    if (updateData.gender) staff.gender = updateData.gender;
    if (updateData.address) staff.address = updateData.address;
    if (updateData.mobileNo) staff.mobileNo = updateData.mobileNo;
    if (updateData.email) staff.email = updateData.email;
    if (updateData.hospitalName) staff.hospitalName = updateData.hospitalName;
    if (updateData.department) staff.department = updateData.department;
    if (updateData.position) staff.position = updateData.position;
    if (updateData.mmcRegistrationNo) staff.mmcRegistrationNo = updateData.mmcRegistrationNo;
    if (updateData.image) staff.image = updateData.image;
    if (updateData.imageSecond) staff.imageSecond = updateData.imageSecond;
    // ... (add other fields as needed)

    // Save the updated staff data
    await staff.save();

    // You can choose which fields to include in the response
    const responseData = {
      image: staff.image,
      imageSecond: staff.imageSecond,
      username: staff.username,
      firstName: staff.firstName,
      surname: staff.surname,
      dob: staff.dob,
      icNo: staff.icNo,
      gender: staff.gender,
      address: staff.address,
      mobileNo: staff.mobileNo,
      email: staff.email,
      hospitalName: staff.hospitalName,
      department: staff.department,
      position: staff.position,
      mmcRegistrationNo: staff.mmcRegistrationNo,
      // ... (add other fields as needed)
    };

    res.json(responseData);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// app.put('/updatePatientInfo/:icNo', upload.fields([
//   { name: 'profilePic', maxCount: 1 },

// ]), async (req, res) => {
//   try {
//     const patientIcNo = req.params.icNo;
//     const updateData = req.body;

//     // Check if 'image' and 'imageSecond' fields are present in the request files
//     if (req.files && req.files['image']) {
//       updateData.profilePic = req.files['image'][0].filename;
//     }
   
    

//     // Find patient by icNo
//     const patient = await Patient.findOne({ icNo: patientIcNo });

//     if (!patient) {
//       return res.status(404).json({ message: 'Patient not found' });
//     }

//     // Update patient's information with the data from the request body
   
//     if (updateData.firstName) patient.firstName = updateData.firstName;
//     if (updateData.surname) patient.surname = updateData.surname;
//     if (updateData.dob) patient.dob = updateData.dob;
//     if (updateData.mrnNo) patient.mrnNo = updateData.mrnNo;
//     if (updateData.icNo) patient.icNo = updateData.icNo;
//     if (updateData.gender) patient.gender = updateData.gender;
    
//     if (updateData.mobileNo) patient.mobileNo = updateData.mobileNo;
//     if (updateData.email) patient.email = updateData.email;
//     if (updateData.ethnicity) patient.ethnicity = updateData.ethnicity;

    
//     if (req.files && req.files['profilePic']) {
//       updateData.profilePic = req.files['profilePic'][0].filename; // Correct field name
//     }
//     if (req.files && req.files['profilePic']) {
//       patient.profilePic = req.files['profilePic'][0].filename; // Assign to patient model
//     }
//     // if (updateData.nextOfKin.firstName) patient.nextOfKin.firstName = updateData.nextOfKin.firstName;
//     // if (updateData.nextOfKin.surname) patient.nextOfKin.surname = updateData.nextOfKin.surname;
//     // if (updateData.nextOfKin.mobileNo) patient.nextOfKin.mobileNo = updateData.nextOfKin.mobileNo;
//     // ... (add other fields as needed)

//     // Save the updated patient data
//     await patient.save();

//     // You can choose which fields to include in the response
//     const responseData = {
//       profilePic: patient.profilePic,
      
      
//       firstName: patient.firstName,
//       surname: patient.surname,
//       dob: patient.dob,
//       icNo: patient.icNo,
//       gender: patient.gender,
//       address: patient.address,
//       mobileNo: patient.mobileNo,
//       email: patient.email,
//       ethnicity: patient.ethnicity,
//      nextOfKin:{
//       firstName:patient.nextOfKin.firstName,
//       surname:patient.nextOfKin.surname,
//       mobileNo: patient.nextOfKin.mobileNo
//      }
//       // ... (add other fields as needed)
//     };

//     res.json(responseData);
//   } catch (err) {
//     console.log(err.message);
//     console.log(err);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

app.put('/updatePatientInfo/:icNo', upload.fields([
  { name: 'profilePic', maxCount: 1 }
]), async (req, res) => {
  try {
    const patientIcNo = req.params.icNo;
    let updateData = req.body;

    // Find patient by icNo
    const patient = await Patient.findOne({ icNo: patientIcNo });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Update patient's information with the data from the request body
   
    // Check if profilePic field is present in the request files
    if (req.files && req.files['profilePic']) {
      if (patient.profilePic) {
        const existingFilePath = path.join(imagesDirectory, patient.profilePic);
        if (fs.existsSync(existingFilePath)) {
          fs.unlinkSync(existingFilePath);
        }
      }
      patient.profilePic = req.files['profilePic'][0].filename;
    }

    patient.firstName = updateData.firstName || patient.firstName;
    patient.surname = updateData.surname || patient.surname;
    patient.dob = updateData.dob || patient.dob;
    patient.mrnNo = updateData.mrnNo || patient.mrnNo;
    patient.icNo = updateData.icNo || patient.icNo;
    patient.gender = updateData.gender || patient.gender;
    patient.mobileNo = updateData.mobileNo || patient.mobileNo;
    patient.email = updateData.email || patient.email;
    patient.ethnicity = updateData.ethnicity || patient.ethnicity;
    patient.nextOfKin.firstName = updateData.nextOfKin.firstName || patient.nextOfKin.firstName;
    patient.nextOfKin.surname = updateData.nextOfKin.surname || patient.nextOfKin.surname;
    patient.nextOfKin.mobileNo = updateData.nextOfKin.mobileNo || patient.nextOfKin.mobileNo;

    // Save the updated patient data
    await patient.save();

    // Prepare and send response data
    const responseData = {
      profilePic: patient.profilePic,
      firstName: patient.firstName,
      surname: patient.surname,
      dob: patient.dob,
      icNo: patient.icNo,
      mrnNo: patient.mrnNo,
      gender: patient.gender,
      address: patient.address,
      mobileNo: patient.mobileNo,
      email: patient.email,
      ethnicity: patient.ethnicity,
      nextOfKin:{
        firstName: patient.nextOfKin.firstName,
        surname: patient.nextOfKin.surname,
        mobileNo: patient.nextOfKin.mobileNo,
      }
      // other fields...
    };

    res.json(responseData);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

mongoose
  .connect(mongoDBURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("App connected to database");
  })
  .catch((error) => {
    console.log(error);
  });
