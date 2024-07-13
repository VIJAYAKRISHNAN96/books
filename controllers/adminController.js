const categoryModel = require("../model/categoryModel");
const userModel = require("../model/userModel");
const productModel = require("../model/productModel");
const sharp = require("sharp");
const fs = require("fs");
const path = require('path');


// const User = require("../model/userModel");
const bcrypt = require("bcryptjs");

// Admin controller object
const adminController = {
  loadAdminLogin: (req, res) => {
    res.render("adminLogin");
  },
  processAdminLogin: async (req, res) => {
    const { email, password } = req.body;
    console.log("dssdsdsdfsdfsdfsdf", req.body);
    try {
      const adminData = await userModel.findOne({ email: email });
      if (adminData && adminData.isAdmin) {
        console.log(adminData.password, password);
        const passwordMatch = bcrypt.compareSync(password, adminData.password);
        console.log(passwordMatch);
        if (passwordMatch) {
          console.log(passwordMatch);
          req.session.adminSession = adminData._id;console.log("Session set:", req.session.adminSession);


          
          console.log("Redirecting to dashboard");
          return res.status(200).redirect("/admin/dashboard");
        } else {
          return res
            .status(401)
            .render("adminLogin", {message: `<script>Swal.fire({ title: 'Error!', text: 'Incorrect password', icon: 'error', confirmButtonText: 'OK' })</script>`});
        }
      } else {
        return res
          .status(401)
          .render("adminLogin", { message: `<script>Swal.fire({ title: 'Error!', text: 'Admin not found', icon: 'error', confirmButtonText: 'OK' })</script>` });
      }
    } catch (error) {
      console.log("Error in processAdminLogin", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },


  loadDashboard: (req, res) => {
    res.render("dashboard");
  },

  loadProduct: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
      const limit = parseInt(req.query.limit) || 5;  // Default to 5 items per page if not provided
      const offset = (page - 1) * limit;
      const total = await productModel.countDocuments();
      const totalPages = Math.ceil(total / limit);
      const products = await productModel.find().skip(offset).limit(limit);

      console.log(products); // Log the products to verify the data
      res.render("products", { 
        products, 
        currentPage: page, 
        totalPages: totalPages, 
        limit: limit 
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
    }
  },
  loadaddProductpage : async (req, res) => {
    try {
      const product = await productModel.findById(req.params.id);
      const categories = await categoryModel.find();
      res.render("addProduct", { product,categories });
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }

  },
 
    
  loadaddProduct: async (req, res) => {
    try {
      const { name, description, author, price, category,stock} = req.body;
      const parsedPrice = parseFloat(price);
      const parsedStock = parseInt(stock);
      const images = [];

      for (const file of req.files) {
        const filename = Date.now() + path.extname(file.originalname);
        const outputPath = path.join(__dirname, '../public/userAssets/imgs/shop', filename);

        await sharp(file.path)
          // .resize(500, 500)
          .toFile(outputPath);

        images.push(filename);

        // Delete the original file uploaded by multer
        // fs.unlinkSync(file.path);
      }

      const productExists = await productModel.findOne({ name, description, author, price:parsedPrice, category ,stock : parsedStock});
      if (productExists) {
        return res.render("addProduct", { message: "Product already exists" });
      }

      const newProduct = new productModel({ name, description, author, price:parsedPrice, category,stock:parsedStock, images });
      await newProduct.save();
      return res.status(200).redirect("/admin/products");
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
    }
  },
  loadeditProductpage : async (req, res) => {
    try {
      const product = await productModel.findById(req.params.id);
      const categories = await categoryModel.find();

      res.render("editProduct", { product,categories });

      // res.render("editProduct");
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }

  },
  // editProduct: async (req, res) => {
  //   try {
  //     const { name, description, author, price, category,stock,discountPrice } = req.body;
      
  //     const product = await productModel.findById(req.params.id);

  //     if (req.files.length > 0) {
  //       const images = [];

  //       for (const file of req.files) {
  //         const filename = Date.now() + path.extname(file.originalname);
  //         const outputPath = path.join(__dirname, '../public/userAssets/imgs/shop', filename);

  //         await sharp(file.path)
  //           .resize(500, 500)
  //           .toFile(outputPath);

  //         images.push(filename);

  //         // Delete the original file uploaded by multer
  //         // fs.unlinkSync(file.path);
  //       }

  //       product.images = images;
  //     }

  //     product.name = name;
  //     product.description = description;
  //     product.price = parseFloat(price);
  //     product.author = author;
  //     product.category = category;
  //     product.stock = parseFloat(stock);
  //     product.discountPrice = discountPrice;

  //     await product.save();
  //     return res.status(201).redirect('/admin/products');
  //   } catch (error) {
  //     console.error(error.message);
  //     res.status(500).send('Internal Server Error');
  //   }
  // },
//   editProduct: async (req, res) => {
//     try {
//         const { name, description, author, price, category, stock, discountPrice } = req.body;
        
//         const product = await productModel.findById(req.params.id);
//         if (!product) {
//             return res.status(404).send('Product not found');
//         }

//         // Keep existing images
//         const images = req.body.existingImages ? req.body.existingImages : [];
        
//         // Process new images if any
//         if (req.files && req.files.length > 0) {
//             for (const file of req.files) {
//                 const filename = Date.now() + path.extname(file.originalname);
//                 const outputPath = path.join(__dirname, '../public/userAssets/imgs/shop', filename);

//                 await sharp(file.path)
//                     .resize(500, 500)
//                     .toFile(outputPath);

//                 images.push(filename);
//             }
//         }

//         // Update product details
//         product.name = name;
//         product.description = description;
//         product.price = parseFloat(price);
//         product.author = author;
//         product.category = category;
//         product.stock = parseFloat(stock);
//         product.discountPrice = discountPrice;
//         product.images = images; // Save the combined images array

//         await product.save();
//         return res.status(201).redirect('/admin/products');
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Internal Server Error');
//     }
// },
editProduct: async (req, res) => {
  try {
      const { name, description, author, price, category, stock, discountPrice, existingImages } = req.body;

      const product = await productModel.findById(req.params.id);
      if (!product) {
          return res.status(404).send('Product not found');
      }

      // Start with existing images
      const images = existingImages ? existingImages : [];

      // Process new images
      if (req.files && req.files.length > 0) {
          for (const file of req.files) {
              const filename = Date.now() + path.extname(file.originalname);
              const outputPath = path.join(__dirname, '../public/userAssets/imgs/shop', filename);

              await sharp(file.path)
                  .resize(500, 500)
                  .toFile(outputPath);

              images.push(filename);
          }
      }

      // Update product details
      product.name = name;
      product.description = description;
      product.price = parseFloat(price);
      product.author = author;
      product.category = category;
      product.stock = parseFloat(stock);
      product.discountPrice = discountPrice;
      product.images = images; // Save the combined images array

      await product.save();
      return res.status(201).redirect('/admin/products');
  } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
  }
},

  
//  deleteCategory : async (req, res) => {
//   const { id } = req.params;
//   console.log(req.params + "Delete category .................")
//   try {
//       await categoryModel.findByIdAndDelete(id);
//       return res.status(200).redirect('/admin/category');
//   } catch (error) {
//       console.error(error.message);
//       res.status(500).send('Internal Server Error');
//   }
// },
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(req.params + "Delete product .................")
      await productModel.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },
  

  loadCategory: async (req, res) => {
    try {
      const category = await categoryModel.find();
      // console.log(category);
      res.render("category", { category : category });
  } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
  }
    // res.render("category");

  },
  
  //   addCategory : async (req, res) => {
  //     const { name, description,discount } = req.body;
  //     console.log("dssdsdsdfsdfsdfsdf", req.body);
  //     try {
  //         const newCategory = new categoryModel ({ name, description,discount });
  //         await newCategory.save();
  //         return res.status(200).redirect("/admin/category")
  //     } catch (error) {
  //         console.error(error.message);
  //         res.status(500).send('Internal Server Error rrrr');
  //     }
  // },
  addCategory: async (req, res) => {
    const { name, description, discount } = req.body;
    console.log("Adding category:", req.body);
    try {
        if (!name || !description) {
            return res.status(400).send('Name and description are required');
        }
        const newCategory = new categoryModel({ 
            name, 
            description, 
            discount: discount ? Number(discount) : undefined 
        });
        await newCategory.save();
        return res.status(201).redirect("/admin/category")
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).send('Internal Server Error');
    }
},
  // editCategory : async (req, res) => {
  //   const _id = req.params.id;
  //   const { name, description,discount } = req.body;
  //   console.log("dssdsdsdfsdfsdfsdf", req.body);
  //   try {
  //       await categoryModel.findByIdAndUpdate(_id, { name, description,discount });
  //       return res.status(201).redirect('/admin/category');
  //   } catch (error) {
  //       console.error(error.message);
  //       res.status(500).send('Internal Server Error');
  //   }
  // },
  editCategory: async (req, res) => {
    const _id = req.params.id;
    const { name, description, discount } = req.body;
    console.log("Editing category:", req.body);
    try {
        if (!name || !description) {
            return res.status(400).send('Name and description are required');
        }
        await categoryModel.findByIdAndUpdate(_id, { 
            name, 
            description, 
            discount: discount ? Number(discount) : undefined 
        });
        return res.status(200).redirect('/admin/category');
    } catch (error) {
        console.error('Error editing category:', error);
        res.status(500).send('Internal Server Error');
    }
},

deleteCategory : async (req, res) => {
  const { id } = req.params;
  console.log(req.params + "Delete category .................")
  try {
      await categoryModel.findByIdAndDelete(id);
      return res.status(200).redirect('/admin/category');
  } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
  }
},

loadUserlist: async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const searchQuery = req.query.search || '';
    const statusFilter = req.query.status || '';

    const filter = { isAdmin: false };


    // if (searchQuery) {
    //   filter.name = { $regex: searchQuery, $options: 'i' }; // Case-insensitive search
    // }

    if (searchQuery) {
      filter.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    if (statusFilter === 'Active') {
      filter.isBlocked = false;
    } else if (statusFilter === 'Disabled') {
      filter.isBlocked = true;
    }

    


    const total = await userModel.countDocuments();
    const totalPages = Math.ceil(total / limit);
    const userList = await userModel.find(filter).skip(offset).limit(limit);

    // const userList = await userModel.find({ isAdmin: false }).skip(offset).limit(limit);
    console.log(userList);
    
    return res.render("userlist", {
      userList: userList,
      currentPage: page,
      totalPages: totalPages,
      limit: limit,
      searchQuery: searchQuery,
      statusFilter: statusFilter,
      message: null,
      messageType: null
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal server error");
  }
},


  toggleBlockUser: async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      user.isBlocked = !user.isBlocked;
      await user.save();
      res.json({ isBlocked: user.isBlocked });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  

  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.redirect("/admin/adminLogin");
    });
  },

};

module.exports = adminController;


