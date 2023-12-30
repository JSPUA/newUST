import mongoose from 'mongoose';

const stentRecordSchema = new mongoose.Schema({
  caseID: String,
  mrnNo: { type: String, ref: 'Patient' },
  icNo: { type: String, ref: 'Patient' },
  firstName: { type: String, ref: 'Patient' },
  surname: { type: String, ref: 'Patient' },
  mobileNo: { type: String, ref: 'Patient' },
  email: { type: String, ref: 'Patient' },
  stentData: [
    {
     
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
    },
  ],
});

const StentRecord = mongoose.model('StentRecord', stentRecordSchema);

export default StentRecord;
