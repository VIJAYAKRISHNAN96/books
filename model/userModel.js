const mongoose=require("mongoose")

const userSchema= mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    phone:{
        type:Number
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    
    isBlocked:{
        type:Boolean,
        default:false
    },
    createdOn:{
        type:Date
    },
   

    address:[{
        houseName:{
            type:String
        },
        street:{
            type:String

        },

        city:{
            type:String
        },
        state:{
            type:String
        },
        country:{
            type:String
        },
        pincode:{
            type:Number
        },
        addressType:{
            type:String
        }
    
    }],
    cart: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
          quantity: { type: Number, default: 1 }
        }
      ]

})

module.exports  = mongoose.model("User",userSchema);







