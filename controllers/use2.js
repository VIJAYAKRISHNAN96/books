
mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
require("dotenv").config();

const User= require("../model/userModel");
const Product = require("../model/productModel");
const Cart = require("../model/cartModel")


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
        console.log('Incoming OTP:', req.body.otp);

        if (!req.session.details) {
            console.log('Session expired.');
            return res.json({ status: "error", message: "Session expired. Please start over." });
        }

        console.log('Session details:', req.session.details);
        console.log('Session OTP:', req.session.details.otp);
        console.log('OTP Expiration:', req.session.details.otpExpiration);

        const inputOtp = parseInt(req.body.otp, 10);
        console.log('Parsed Input OTP:', inputOtp);

        if (req.session.details.otp === inputOtp) {
            if (req.session.details.otpExpiration < Date.now()) {
                console.log('OTP expired.');
                return res.json({ status: "error", message: "OTP expired. Please request a new one." });
            } else {
                console.log('OTP valid, creating user...');
                const hashedPassword = await securePassword(req.session.details.password);
                console.log('Hashed Password:', hashedPassword);

                const user = new User({
                    name: req.session.details.name,
                    email: req.session.details.email,
                    password: hashedPassword,
                    isAdmin: 0,
                    isBlocked: false,
                });

                await user.save();
                console.log('User created successfully.');
                // req.session.destroy();
                return res.json({ status: "success", message: "OTP verified successfully. Redirecting to login." });
            }
        } else {
            console.log('Invalid OTP.');
            return res.json({ status: "error", message: "Invalid OTP. Please try again." });
        }
    } catch (error) {
        console.log("Error in verifyOTP:", error.message);
        console.error("Detailed error:", error);
        res.status(500).json({ status: "error", message: "Internal server error. Please try again later." });
    }
},

  
  // verifyOTP: async (req, res) => {
  //   try {

  //     console.log(req.body,'incomming otp')
  //     if (!req.session.details) {
  //       return res.json({ message: "Session expired. Please start over." });
  //     }

  //     if (req.session.details.otp === parseInt(req.body.otp)) {
  //       if (req.session.details.otpExpiration < Date.now()) {
  //         return res.json({ expired: true });
  //       } else {
  //         console.log(req.session.details,'session is comming')
  //         const hashedPassword = await securePassword(req.session.details.password);
  //         console.log(hashedPassword,'hello password')

  //         const user = new User({
  //           name: req.session.details.name,
  //           email: req.session.details.email,
  //           password: hashedPassword,
  //           isAdmin: 0,
  //           isBlocked: false,
  //         });
               
  //         await user.save();
  //       //   req.session.destroy();
  //         res. redirect("/login");
  //       }
  //     } else {
  //       return res.json({ message: "Invalid OTP" });
  //     }
  //   } catch (error) {
  //     console.log("Error in verifyOTP:", error.message);
  //     res.status(500).json({ message: "Internal server error" });
  //   }
  // },
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
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const category = req.query.category;
      const sortBy = req.query.sortBy;
      const offset = (page - 1) * limit;
  
      let query = {};
      if (category) {
        query.category = category;
      }
      let sort = {};
        if (sortBy === 'priceAsc') {
            sort = { price: 1 }; // Sort by price ascending
        } else if (sortBy === 'priceDesc') {
            sort = { price: -1 }; // Sort by price descending
        }
  
      const total = await Product.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
      const products = await Product.find(query).sort(sort).skip(offset).limit(limit);

      // const products = await Product.find(query).skip(offset).limit(limit);
       
  
      res.render('shop', { 
        products: products,
        currentPage: page,
        totalPages: totalPages,
        limit: limit,
        category: category,
        sortBy: sortBy
        
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  },
  
  // loadProductDetail : async (req, res) => {
  //   try {
  //     const productId = req.params.productId;
  //     const product = await Product.findById(productId);
  
  //     if (!product) {
  //       return res.status(404).send('Product not found');
  //     }
  
  //     res.render('productDetails', {
  //       product: product,
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).send('Internal server error');
  //   }
  // },
  
  // 
//   loadProductDetails: async (req, res) => {
//     try {
//         const userId = req.session.user ? req.session.user.id : null; // Safely access user ID
//         const productId = req.params.productId; // Get product ID from request params

//         const product = await Product.findById(productId); // Fetch the product from the database
//         if (!product) {
//             return res.status(404).send('Product not found');
//         }

//         res.render('productDetails', { product, user: { id: userId } }); // Pass user ID to EJS
//     } catch (error) {
//         console.error('Error loading product details:', error);
//         res.status(500).send('Internal Server Error');
//     }
// },
// loadProductDetails: async (req, res) => {
//   try {
//       const productId = req.params.productId;
//       const product = await Product.findById(productId);

//       if (!product) {
//           return res.status(404).render('user/errorPage', { message: 'Product not found' });
//       }

//       res.render('user/productDetails', { product });
//   } catch (error) {
//       console.error('Error loading product details:', error);
//       res.status(500).render('user/errorPage', { message: 'Internal Server Error' });
  
//     }
// },



loadProductDetails : async (req, res) => {
  try {
    const productId = req.query.id;
    if (!productId) {
      return res.status(400).send('Product ID is required');
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send('Product not found');
    }

    const relatedProducts = await Product.find({ category: product.category, _id: { $ne: productId } }).limit(4);

      res.render('productDetails', { product, relProduct: relatedProducts });

    // res.render('productDetails', { product });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
},
 
// last changed
// addToCart: async (req, res) => {
//   try {
//     const userId = req.session.user._id;

//     // Log the incoming request body
//     console.log('Request Body:', req.body);
//     console.log('Incoming request to addToCart:', req.body)

//     const { productId, quantity } = req.body;

//     // Validate input
//     if (!productId) {
//       return res.status(400).json({ error: 'Product ID is required' });
//     }
//     if (!quantity || isNaN(quantity) || quantity <= 0) {
//       return res.status(400).json({ error: 'Quantity must be a positive number' });
//     }

//     // Find or create cart
//     let cart = await Cart.findOne({ userId }) || new Cart({ userId, products: [] });

//     // Update cart
//     const existingProductIndex = cart.products.findIndex(p => p.productId.toString() === productId);
//     if (existingProductIndex > -1) {
//       cart.products[existingProductIndex].quantity += parseInt(quantity);
//     } else {
//       cart.products.push({ productId, quantity: parseInt(quantity) });
//     }

//     await cart.save();
//     console.log('Cart updated successfully:', cart);
    
//     res.status(200).json({ message: 'Product added to cart successfully' });
//   } catch (error) {
//     console.error('Error adding to cart:', error);
//     res.status(500).json({ error: 'Error adding item to cart' });
//   }
// },


// loadCart: async (req, res) => {
//   try {
//     const user = req.session.user;
//     if (!user || !user.cart || user.cart.length === 0) {
//       return res.render('cart', { cart: { product: [] } });
//     }
    
//     const products = await Product.find({ _id: { $in: user.cart } });
    
//     // If you have quantity information, you could add it here
//     const productsWithQuantity = products.map(product => ({
//       ...product.toObject(),
//       quantity: 1 // Replace with actual quantity if available
//     }));

//     res.render('cart', { cart: { product: productsWithQuantity } });
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send('Internal Server Error');
//   }
// },



// last modi

// loadCart: async (req, res) => {
//   try {
//       const userId = req.session.user?.id;
//       if (!userId) {
//           return res.redirect('/login'); // Redirect to login if user is not logged in
//       }

//       const cart = await Cart.findOne({ userId });
//       if (!cart || cart.products.length === 0) {
//           return res.render('cart', { cart: { products: [] } });
//       }

//       const productIds = cart.products.map(item => item.productId);
//       const products = await Product.find({ _id: { $in: productIds } });

//       // Combine products with quantities
//       const productsWithQuantity = products.map(product => {
//           const cartItem = cart.products.find(item => item.productId.toString() === product._id.toString());
//           return {
//               ...product.toObject(),
//               quantity: cartItem ? cartItem.quantity : 1 // Replace with actual quantity
//           };
//       });

//       res.render('cart', { cart: { products: productsWithQuantity } });
//   } catch (error) {
//       console.log('Error loading cart:', error.message);
//       res.status(500).send('Internal Server Error');
//   }
// },
//  loadCart : async (req, res) => {
//   try {
//       const userId = req.session.user._id; // Assuming user ID is stored as _id in session
//       const page = parseInt(req.query.page, 10) || 1;
//       const limit = 5; // Number of items per page
//       const skip = (page - 1) * limit;

//       let cart = await Cart.findOne({ userId }).populate('products.productId');
      
//       if (!cart) {
//           cart = { products: [], totalPrice: 0 };
//       }

//       const paginatedProducts = cart.products.slice(skip, skip + limit);
//       const totalItems = cart.products.length;
//       const totalPages = Math.ceil(totalItems / limit);

//       // Ensure totalPrice is a number and format it
//       cart.totalPrice = parseFloat((cart.totalPrice || 0).toFixed(2));

//       res.render('cart', {
//           cart: {
//               products: paginatedProducts,
//               totalQuantity: totalItems,
//               totalPrice: cart.totalPrice,
//               totalPages,
//               currentPage: page
//           }
//       });
//   } catch (error) {
//       console.error('Error loading cart:', error.message);
//       res.status(500).render('error', { message: 'Internal Server Error', messageType: 'error' });
//   }
// },

//  =========  last modi ======  >>>> addToCart : async (req, res) => {
//   try {
//     console.log("addToCart method called");
//         console.log("Request body:", req.body);
//         console.log("Full session object:", req.session);
//         console.log("User in session:", req.session.user);


//         if (!req.session || !req.session.user || !req.session.user.id) {
//           console.log("User session not found or incomplete");
//           return res.status(401).json({ error: 'User not authenticated' });
//       }


//       const userId = req.session.user.id;
//       console.log("User ID:", userId);
//       // const { productId, quantity = 1 } = req.body;

//       console.log("Product ID:", productId);
//       console.log("Quantity:", quantity);

//       if (!product) {
//         console.log("Product ID is missing");
//           return res.status(400).json({ error: 'Product ID is required' });
//       }
//       if (isNaN(quantity) || quantity <= 0) {
//         console.log("Invalid quantity:", quantity);

//           return res.status(400).json({ error: 'Quantity must be a positive number' });
//       }

//       const product = await Product.findById(productId);
//       if (!product) {
//           return res.status(404).json({ error: 'Product not found' });
//       }

//       let cart = await Cart.findOne({ userId });
//       console.log("Existing cart:", cart);

//       if (!cart) {
//           console.log("Creating new cart");
//           cart = new Cart({ userId, products: [] });
//       }

//       const existingProductIndex = cart.products.findIndex(item => item.productId.equals(productId));
//       if (existingProductIndex !== -1) {
//           console.log("Product already in cart");
//           return res.json({ alreadyInCart: true });
//       }

//       const productPrice = (product.mainprice !== 0 && product.mainprice < product.price) ? product.mainprice : product.price;
//       console.log("Product price:", productPrice);


//       cart.products.push({ productId, quantity: parseInt(quantity), productPrice });
//       cart.total += productPrice * parseInt(quantity);

//       console.log("Updated cart:", cart);

//       await cart.save();
//       console.log("Cart saved successfully");



//       res.json({ success: true });
//   } catch (error) {
//       console.log("Error Occurred: ", error);
//       res.status(500).send('Internal Server Error');
//   }
// },
addToCart: async (req, res) => {
  try {
      console.log("Full session object:", req.session);
      
      if (!req.session || !req.session.user || !req.session.user.id) {
          return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const userId = req.session.user.id;
      const { productId, quantity = 1 } = req.body;
      
      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).json({ error: 'Product not found' });
      }
      
      let cart = await Cart.findOne({ userId });
      if (!cart) {
          cart = new Cart({ userId, products: [], totalPrice: 0 });
      }
      
      const productPrice = (product.mainprice !== 0 && product.mainprice < product.price) ? product.mainprice : product.price;
      
      cart.products.push({ productId, quantity: parseInt(quantity), productPrice });
      cart.totalPrice += productPrice * parseInt(quantity);
      
      await cart.save();
      
      res.json({ success: true, message: 'Product added to cart' });
  } catch (error) {
      console.error("Error in addToCart:", error);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
},

// loadCart : async (req, res) => {
//   try {
//       const userId = req.session.user._id;
//       const page = parseInt(req.query.page) || 1;
//       const limit = 5; // Number of items per page
//       const skip = (page - 1) * limit;

//       const cart = await Cart.findOne({ userId })
//           .populate({
//               path: 'products.productId',
//               select: 'name price images'
//           })
//           .lean();

//       if (!cart) {
//           return res.render('cart', { cart: { products: [], totalPages: 0, currentPage: 1 } });
//       }

//       const totalProducts = cart.products.length;
//       const totalPages = Math.ceil(totalProducts / limit);

//       const paginatedProducts = cart.products.slice(skip, skip + limit);

//       res.render('cart', { 
//           cart: { 
//               products: paginatedProducts,
//               currentPage: page,
//               totalPages: totalPages
//           } 
//       });
//   } catch (error) {
//       console.log(error.message);
//       res.status(500).send('Internal Server Error');
//   }
// },


// addToCart :async (req, res) => {
//   try {
//       const userId = req.session.user._id;
//       const { productId, quantity } = req.body;

//       // Find the user's cart or create a new one if it doesn't exist
//       let cart = await Cart.findOne({ userId });
//       if (!cart) {
//           cart = new Cart({ userId, products: [] });
//       }

//       // Check if the product is already in the cart
//       const existingProductIndex = cart.products.findIndex(
//           (p) => p.productId.toString() === productId
//       );

//       if (existingProductIndex > -1) {
//           // If the product is already in the cart, update its quantity
//           cart.products[existingProductIndex].quantity += parseInt(quantity);
//       } else {
//           // If it's a new product, add it to the cart
//           cart.products.push({ productId, quantity: parseInt(quantity) });
//       }

//       // Save the updated cart
//       await cart.save();

//       res.redirect('/cart');
//   } catch (error) {
//       console.error('Error adding to cart:', error);
//       res.status(500).send('Error adding item to cart');
//   }
// },




// addToCart : async (req, res) => {
//   try {
//     const { userId, productId } = req.query;
//     const { quantity } = req.body;

//     if (!req.session.user) {
//       return res.status(401).json({ message: "User not authenticated" });
//     }

//     const user = await User.findById(req.session.user._id);
//     const product = await Product.findById(productId);

//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     if (product.stock == 0) {
//       return res.json({ success: false, message: "Out of Stock" });
//     }

//     if (!userId || !productId) {
//       return res.status(400).json({ message: "UserId and ProductId are required" });
//     }

//     let cart = await Cart.findOne({ userId });

//     if (!cart) {
//       cart = new Cart({ userId });
//     }

//     const productIndex = cart.product.findIndex(item => item.productId.toString() === productId);

//     if (productIndex !== -1) {
//       // if the product exists, increase the quantity by one
//       cart.product[productIndex].quantity += quantity ? quantity : 1;
//     } else {
//       cart.product.push({ productId, quantity: quantity ? quantity : 1 });
//     }

//     await cart.save();
//     res.json({ success: true });

//   } catch (error) {
//     console.log(error.message);
//     res.status(500).json({ message: "Internal server error" });
//   }
// },

// addToCart: async (req, res) => {
//   try {
//     const { userId, productId } = req.query;
//     const { quantity = 1 } = req.body;

//     if (!req.session.user) {
//       return res.status(401).json({ message: "User not authenticated" });
//     }

//     const user = await User.findById(req.session.user._id);

//     // Handle potential database errors during user lookup
//     if (!user) {
//       return res.status(500).json({ message: "Internal server error (user lookup failed)" });
//     }


  

//     const product = await Product.findById(productId);

//     // Handle product not found specifically
//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     if (product.stock == 0) {
//       return res.json({ success: false, message: "Out of Stock" });
//     }

//     if (quantity <= 0) {
//       return res.status(400).json({ message: "Invalid quantity. Please enter a positive value." });
//     }

//     if (!userId || !productId) {
//       return res.status(400).json({ message: "UserId and ProductId are required" });
//     }

//     let cart = await Cart.findOne({ userId });

//     // Handle potential database errors during cart lookup
//     if (!cart) {
//       return res.status(500).json({ message: "Internal server error (cart lookup failed)" });
//     }

//     const productIndex = cart.product.findIndex(item => item.productId.toString() === productId);

//     if (productIndex !== -1) {
//       // if the product exists, increase the quantity by one
//       cart.product[productIndex].quantity += quantity;
//     } else {
//       cart.product.push({ productId, quantity });
//     }

//     await cart.save();
//     res.json({ success: true });

//   } catch (error) {
//     console.error(error.message);
//     res.status(500).json({ message: "Error adding product to cart" });
//   }
// },
// addToCart : async (req, res) => {
//   try {
//       const userId = req.session.user.userId;
//       const productId = req.body.productId;
//       const quantity = parseInt(req.body.quantity, 10) || 1; // Ensure quantity is an integer

//       let cart = await Cart.findOne({ userId });

//       if (cart) {
//           // Check if product already exists in cart
//           const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);
//           if (productIndex > -1) {
//               // Update quantity
//               cart.products[productIndex].quantity += quantity;
//           } else {
//               // Add new product to cart
//               cart.products.push({ productId, quantity });
//           }
//       } else {
//           // Create new cart for user
//           cart = new Cart({ userId, products: [{ productId, quantity }] });
//       }

//       // Fetch the product price
//       const product = await Product.findById(productId);
//       const productPrice = product ? product.price : 0;

//       // Recalculate total price
//       cart.totalPrice = cart.products.reduce((total, item) => {
//           return total + (productPrice * item.quantity);
//       }, 0);

//       // Save the updated cart
//       await cart.save();

//       res.status(200).json({ success: true, message: 'Product added to cart successfully' });
//   } catch (error) {
//       console.error('Error adding to cart:', error.message);
//       res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// }, 

// last modif
// addToCart: async (req, res) => {
//   try {
//       const userId = req.session.user.id; // Access user ID from session
//       console.log('User ID from session:', userId);

//       const productId = req.body.productId;
//       const quantity = parseInt(req.body.quantity, 10) || 1; // Ensure quantity is an integer

//       let cart = await Cart.findOne({ userId });

//       if (cart) {
//           // Ensure products array is initialized
//           if (!cart.products) {
//               cart.products = [];
//           }

//           // Check if product already exists in cart
//           const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);
//           if (productIndex > -1) {
//               // Update quantity
//               cart.products[productIndex].quantity += quantity;
//           } else {
//               // Add new product to cart
//               cart.products.push({ productId, quantity });
//           }
//       } else {
//           // Create new cart for user
//           cart = new Cart({ userId, products: [{ productId, quantity }] });
//       }

//       // Fetch the product price
//       const product = await Product.findById(productId);
//       const productPrice = product ? product.price : 0;

//       // Recalculate total price
//       cart.totalPrice = cart.products.reduce((total, item) => {
//           return total + (productPrice * item.quantity);
//       }, 0);

//       // Save the updated cart
//       await cart.save();

//       res.status(200).json({ success: true, message: 'Product added to cart successfully' });
//   } catch (error) {
//       console.error('Error adding to cart:', error.message);
//       res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// },
// addToCart: async (req, res) => {
//   try {
//     const userId = req.session.user.id; // Adjust this based on your session structure
//     const productId = req.body.productId;
//     const quantity = parseInt(req.body.quantity, 10) || 1;

//     if (!userId) {
//       return res.status(401).json({ success: false, message: 'User not authenticated' });
//     }

//     let cart = await Cart.findOne({ userId });

//     if (cart) {
//       const productIndex = cart.product.findIndex(p => p.productId.toString() === productId);
//       if (productIndex > -1) {
//         // Update quantity
//         cart.products[productIndex].quantity += quantity;
//       } else {
//         // Add new product to cart
//         cart.products.push({ productId, quantity });
//       }
//     } else {
//       // Create new cart for user
//       cart = new Cart({ userId, products: [{ productId, quantity }] });
//     }

//     await cart.save();
//     res.status(200).json({ success: true, message: 'Product added to cart successfully' });
//   } catch (error) {
//     console.error('Error adding to cart:', error.message);
//     res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// },
// addToCart: async (req, res) => {
//   try {
//     const userId = req.session.user.id; // Adjusted this line to match your session structure
//     const productId = req.body.productId;
//     const quantity = parseInt(req.body.quantity, 10) || 1; // Ensure quantity is an integer

//     console.log('User ID from session:', userId);
//     console.log('Product ID from request body:', productId);

//     // Fetch the product to ensure it exists
//     const product = await Product.findById(productId);
//     if (!product) {
//       console.error('Product not found');
//       return res.status(404).json({ success: false, message: 'Product not found' });
//     }

//     console.log('Fetched product:', product);

//     let cart = await Cart.findOne({ userId });

//     if (cart) {
//       // Check if product already exists in cart
//       const productIndex = cart.product.findIndex(p => p.productId.toString() === productId);
//       if (productIndex > -1) {
//         // Update quantity
//         cart.product[productIndex].quantity += quantity;
//       } else {
//         // Add new product to cart
//         cart.product.push({ productId, quantity });
//       }
//     } else {
//       // Create new cart for user
//       cart = new Cart({ userId, products: [{ productId, quantity }] });
//     }

//     // Recalculate total price
//     cart.totalPrice = cart.product.reduce((total, item) => {
//       return total + (product.price * item.quantity);
//     }, 0);

//     // Save the updated cart
//     await cart.save();

//     console.log('Updated cart:', cart);

//     res.status(200).json({ success: true, message: 'Product added to cart successfully' });
//   } catch (error) {
//     console.error('Error adding to cart:', error.message);
//     res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// },
// addToCart: async (req, res) => {
//   try {
//       const productId = req.body.productId;
//       const userId = req.session.user?.id;

//       console.log('User ID:', userId);
//       console.log('Product ID received:', productId);

//       if (!userId) {
//           return res.status(401).json({ success: false, message: 'User not logged in' });
//       }

//       const user = await User.findById(userId);
//       if (!user) {
//           return res.status(404).json({ success: false, message: 'User not found' });
//       }

//       const product = await Product.findById(productId);
//       if (!product) {
//           return res.status(404).json({ success: false, message: 'Product not found' });
//       }

//       // Initialize cart if it doesn't exist
//       if (!user.cart) {
//           user.cart = [];
//       }

//       const existingProduct = user.cart.find(item => item._id.toString() === productId);

//       if (existingProduct) {
//           existingProduct.quantity += 1;
//       } else {
//           user.cart.push({ _id: productId, quantity: 1 });
//       }

//       await user.save();
//       req.session.user = user;

//       console.log('Session after adding to cart:', req.session);

//       return res.json({ success: true, message: 'Product added to cart' });
//   } catch (error) {
//       console.error('Error while adding to cart:', error);
//       return res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// },
// addToCart: async (req, res) => {
//   try {
//     const productId = req.body.productId;
//     const userId = req.session.user?.id;

//     console.log('User ID:', userId);
//     console.log('Product ID received:', productId);

//     if (!userId) {
//       return res.status(401).json({ success: false, message: 'User not logged in' });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     // Add these two lines here
//     console.log('Attempting to find product with ID:', productId);
//     const product = await Product.findById(productId);

//     if (!product) {
//       return res.status(404).json({ success: false, message: 'Product not found' });
//     }

//     // Rest of the function...
//   } catch (error) {
//     console.error('Error while adding to cart:', error);
//     return res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// },





// removeFromCart :async(req,res)=>{
//   try{
//     const {productId} = req.body;
//     const userId=req.session.user;
//     console.log(productId);
    

//     const cart = await Cart.findOne({userId});

//     const productIndex = cart.product.findIndex(item => item.productId.toString() === productId);

//     if (productIndex === -1) {
//       return res.status(404).json({ success: false, message: 'Product not found in cart' });
//     }
//     cart.product.splice(productIndex, 1);
//     res.status(200).json({ success: true, message: 'Product removed from cart' });
//     await cart.save();
//   }catch(error){
//     console.log(error.message);
//   }
// },

loadCart : async (req, res) => {
  try {
      const userId = req.session.user._id;
      const cart = await Cart.findOne({ userId }).populate('products.productId');

      if (!cart || !cart.products || cart.products.length === 0) {
          return res.render('cart', { cart: { products: [], totalPrice: 0 } });
      }

      // Calculate total price
      cart.totalPrice = cart.products.reduce((total, item) => total + (item.productPrice * item.quantity), 0);

      res.render('cart', { cart });
  } catch (error) {
      console.log('Error Occurred: ', error);
      res.status(500).send('Internal Server Error');
  }
},


loadCheckout: async (req, res) => {
  try {
    const user = req.session.user;
    const products = await Product.find({ _id: { $in: user.cart } });
    res.render('checkout', { products });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }

  

}
}


module.exports = userController;


