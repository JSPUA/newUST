import mongoose from "mongoose";

// models/patient.js

const patientSchema = new mongoose.Schema({
    firstName: String,
    surname: String,
    dob: Date,
    mrnNo: String,
    icNo: String,
    gender: String,
    mobileNo: String,
    email: String,
    ethnicity: String,
    password: String,
    profilePic: String,
    nextOfKin: {
      firstName: String,
      surname: String,
      mobileNo: String,
    },
    stentData: [
      {
        caseId : String,
        laterality: String,
        hospitalName: String,
        insertedDate: Date,
        dueDate: String,
        size: String,
        length: String,
        stentType: String,
        stentBrand: String,
        placeOfInsertion: String,
        remarks: String,
        notificationSent: {
          fourteenDayWarning: { type: Boolean, default: false },
          expired: { type: Boolean, default: false }
        },
      },
    ],
  });
  
  const Patient = mongoose.model('Patient', patientSchema);
  
  export default Patient;
  