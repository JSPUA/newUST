import mongoose from "mongoose";

// models/patient.js

const RemovedStentSchema = new mongoose.Schema({
    caseId: String,
    laterality: String,
    removealDate: Date,
   removalLocation: String,
    removedBy: String,
   
  });
  
  const RemovedStent = mongoose.model('RemovedStent', RemovedStentSchema);
  
  export default RemovedStent;
  