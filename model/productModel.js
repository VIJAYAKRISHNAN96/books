const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    description:{ 
        type: String, 
        required: true
     },
     author:{

     },
    price: { 
        type: Number, 
        required: true 
    },
  
    category: { 
        type: String, 
        required: true },
    images: {
        type: [String],
        validate: [arrayLimit, '{PATH} exceeds the limit of 3'],
    },
    stock:{
        type: Number,
        required:true
    },
    isListed:{
        type: String,
        enum:["Active","Inactive"],
        default:"Active"
    },
    discountPrice:{
        type: Number,
        default:0,
        min:0
    }
});

function arrayLimit(val) {
    return val.length <= 3;
}

module.exports = mongoose.model('Product', productSchema);