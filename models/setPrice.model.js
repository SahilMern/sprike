const mongoose = require('mongoose');

// Define the schema for the Price data
const priceSchema = new mongoose.Schema({
  sethighdeod: {
    type: Number,  
    required: true,
  },
  setlowdeodprice: {
    type: Number,  
    required: true,
  },
}, { timestamps: true });

const deodprice = mongoose.model('deodprice', priceSchema);
module.exports = deodprice;
