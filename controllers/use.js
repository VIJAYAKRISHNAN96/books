

const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
require("dotenv").config();

const User= require("../model/userModel");
const Product = require("../model/productModel");

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate a 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

// Securely hash the password
const securePassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// User controller object
const userController = {
  homePage: (req, res) => {
    res.render('home');
  },
  loadSignup: (req, res) => {
    res.render('signup');
  },
  processSignup: async (req, res) => {
    try {
        
      const details = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        otp: generateOtp(),
        otpExpiration: Date.now() + 5 * 60 * 1000 // 5 minutes expiration
      };
      console.log('saww',req.body)

      console.log('sfsfsf',details)

      req.session.details = details;
      req.session.details = details;
      req.session.save();
      res.redirect("/otpVerify");
      console.log(req.session.details.otp);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: req.body.email,
        subject: "OTP verification",
        text: `Your OTP for verification is: ${details?.otp}`,
      };

      transport.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error occurred while sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });

    //   res.redirect("/otpVerify");
    } catch (error) {
      console.log("Error in processSignup:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  loadLogin: (req, res) => {
    res.render('login');
  },
  processLogin: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(401).render('login', { message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).render('login', { message: 'Invalid email or password' });
      }

      req.session.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        
      };
      res.redirect('/');
    } catch (error) {
      console.log("Error in processLogin:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  
  loadOTP: (req, res) => {
    try {
      res.render("otp", { message: "" });
    } catch (error) {
      console.log("Error in loadOTP:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  verifyOTP: async (req, res) => {
    try {

      console.log(req.body,'incomming otp')
      if (!req.session.details) {
        return res.json({ message: "Session expired. Please start over." });
      }

      if (req.session.details.otp === parseInt(req.body.otp)) {
        if (req.session.details.otpExpiration < Date.now()) {
          return res.json({ expired: true });
        } else {
          console.log(req.session.details,'session is comming')
          const hashedPassword = await securePassword(req.session.details.password);
          console.log(hashedPassword,'hello password')

          const user = new User({
            name: req.session.details.name,
            email: req.session.details.email,
            password: hashedPassword,
            isAdmin: 0,
            isBlocked: false,
          });
               
          await user.save();
        //   req.session.destroy();
          res. redirect("/login");
        }
      } else {
        return res.json({ message: "Invalid OTP" });
      }
    } catch (error) {
      console.log("Error in verifyOTP:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  resendOTP: async (req, res) => {
    try {
      if (!req.session.details) {
        return res.json({ message: "Session expired. Please start over." });
      }

      const newOTP = generateOtp();
      req.session.details.otp = newOTP;
      req.session.details.otpExpiration = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: req.session.details.email,
        subject: "OTP verification",
        text: `Your new OTP for verification is: ${newOTP}`,
      };

      transport.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error occurred while resending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.log("Error in resendOTP:", error.message);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  },
  userLogout: async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.log("Error destroying session:", err);
        }
        res.redirect("/");
      });
    } catch (error) {
      console.log("Error in userLogout:", error.message);
      res.status(500).send("An error occurred during logout");
    }
  },

  loadUser: async(req, res) => {
    res.render('userAccount');
  },
  loadShop: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 5; // Default to 5 items per page if not provided
      const offset = (page - 1) * limit;
      const total = await Product.countDocuments();
      const totalPages = Math.ceil(total / limit);
      const products = await Product.find().skip(offset).limit(limit);

      console.log(products);
      res.render('shop', { 
        products: products,
        currentPage: page,
        totalPages: totalPages,
        limit: limit 
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  },
  loadproductDetails: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if(!product) {
        return res.status(404).send('Product not found');
      }
      res.render('productDetails', { product });
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  }
}


module.exports = userController;


// module.exports = {
//     insertUser,
//     loadOTP,
//     verifyOTP,
//     resendOTP
// }



// const loadSignup = (req,res) => {
//     res.render("signup");
// }


// const homePage = (req,res) => {
//     res.render("home");

// }

// const loadLogin = (req,res) => {
//     res.render("login");
// }

// // const loadOTP = (req,res) => {
// //     res.render("otp");
// // }

// const loadUser = (req,res) => {
//     res.render("userAccount");
// }

// const loadShop = (req,res) => {
//     res.render("shop");
// }

// module.exports={
//     loadSignup,
//     homePage,
//     loadLogin,
//     // loadOTP,
//     loadUser,
//     loadShop ,
//     // loadOTP
// } 

// const userController = {
//     homePage: (req, res) => {
//       res.render('home');
//     },
//     loadSignup: (req, res) => {
//       res.render('signup');
//     },
//     processSignup: (req, res) => {
//       // Logic for processing signup
//     },
//     loadLogin: (req, res) => {
//       res.render('login');
//     },
//     loadOTP: (req, res) => {
//       res.render('otp');
//     },
//     loadUser: (req, res) => {
//       res.render('user');
//     },
//     loadShop: (req, res) => {
//       res.render('shop');
//     },
//     verifyOTP: (req, res) => {
//       // Logic for verifying OTP
//     },
//     resendOTP: (req, res) => {
//       // Logic for resending OTP
//     }
//   };
  
//   module.exports = userController;
  