// const express= require("express");
// const userRouter = express.Router();
// // const auth= require("../middleware/auth")

// // const userController = require("../controllers/userController");

// userRouter.get("/home",userController.homePage);
// userRouter.get("/signup",userController.loadSignup);
// // userRouter.post("/signup",userController.insertUser);

// userRouter.get("/login",userController.loadLogin);
// userRouter.get("/otp",userController.loadOTP);
// userRouter.get("/user",userController.loadUser);
// userRouter.get("/shop",userController.loadShop);
// userRouter.post("/")  
// userRouter.post("/varifyOtp", userController.varifyOTP);
// userRouter.post("/resendOtp", userController.resendOTP);

// // router.post('/signup', insertUser);


// // Load OTP verification page
// router.get('/otpVerify', loadOTP);

// // Verify OTP
// router.post('/verifyOTP', verifyOTP);

// // Resend OTP
// router.post('/resendOTP', resendOTP);  


// // module.exports = userRouter
// const express = require("express");
// const userRouter = express.Router();
// // const auth = require("../middlewares/userAuth");
// const userController = require("../controllers/userController");
// const mongoose = require("mongoose")

// userRouter.get("/home", userController.homePage);
// userRouter.get("/signup", userController.loadSignup);
// // userRouter.post("/signup", userController.insertUser);

// userRouter.get("/login", userController.loadLogin);
// userRouter.get("/otp", userController.loadOTP);
// userRouter.get("/user", userController.loadUser);
// userRouter.get("/shop", userController.loadShop);

// userRouter.post("/varifyOtp", userController.verifyOTP); // Corrected from varifyOTP to verifyOTP
// userRouter.post("/resendOtp", userController.resendOTP); // Corrected from resendOTP to resendOTP

// // Load OTP verification page
// userRouter.get('/otpVerify', userController.loadOTP); // Corrected from router.get to userRouter.get

// // Verify OTP
// userRouter.post('/verifyOTP', userController.verifyOTP); // Corrected from router.post to userRouter.post

// // Resend OTP
// userRouter.post('/resendOTP', userController.resendOTP); // Corrected from router.post to userRouter.post

// module.exports = userRouter;

// const express = require("express");
// const userRouter = express.Router();
// const userController = require("../controllers/userController");

// // Ensure all these functions are defined in the userController
// userRouter.get("/home", userController.homePage);
// userRouter.get("/signup", userController.loadSignup);
// userRouter.post("/signup", userController.processSignup);

// userRouter.get("/login", userController.loadLogin);
// userRouter.get("/otp", userController.loadOTP);
// userRouter.get("/user", userController.loadUser);
// userRouter.get("/shop", userController.loadShop);

// userRouter.post("/verifyOTP", userController.verifyOTP);
// userRouter.post("/resendOTP", userController.resendOTP);

// // Load OTP verification page
// userRouter.get('/otpVerify', userController.loadOTP);

// module.exports = userRouter;
const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");
const auth=require("../middlewares/userAuth");

// Define routes and link them to controller methods
userRouter.get("/", userController.homePage);
userRouter.get("/signup",auth.isLogOut, userController.loadSignup);
userRouter.post("/signup", userController.processSignup);
// userRouter.get("/productDetails",userController.productDetails);
// userRouter.get("/product", userController.loadProductDetail);
userRouter.get("/product", userController.loadProductDetails);
// userRouter.get("/product",userController.loadProductDetails);
// userRouter.get("/productDetails",userController.loadProductDetails);


userRouter.get("/login",auth.isLogOut, userController.loadLogin);
userRouter.post("/login", userController.processLogin);
userRouter.get('/logout',auth.isLogin,userController.userLogout);
userRouter.get("/otp", userController.loadOTP);
userRouter.get("/userAccount",auth.isLogin, userController.loadUser);
userRouter.get("/shop", userController.loadShop);
// userRouter.get('/shop/filter', userController.loadShopByCategory);
userRouter.post("/verifyOTP", userController.verifyOTP);
userRouter.post("/resendOTP", userController.resendOTP);
userRouter.get('/cart',auth.isLogin,userController.loadCart);
userRouter.post("/addToCart",auth.isLogin,userController.addToCart);
// userRouter.post("/cart/remove", auth.isLogin, userController.removeFromCart);
// userRouter.post("/cart/update", auth.isLogin, userController.updateCartItemQuantity)

userRouter.get('/checkout',auth.isLogin, userController.loadCheckout);

userRouter.get('/otpVerify',auth.isLogOut, userController.loadOTP);

module.exports = userRouter;