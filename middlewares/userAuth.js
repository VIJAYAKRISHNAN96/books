// const isLogOut = async (req, res, next) => {
//     try {
//         if (req.session.user) {
//             // If user is already logged in, redirect to home page
//             res.redirect("/");
//         } else {
//             // If user is not logged in, proceed to the next middleware
//             next();
//         }
//     } catch (error) {
//         console.log(error.message);
//         // Handle error if necessary
//     }
// }

// const isLogin = async (req, res, next) => {
//     try {
//         if (req.session.user) {
//             // If user is logged in, proceed to the next middleware
//             next();
//         } else {
//             // If user is not logged in, redirect to login page
//             res.redirect("/login");
//         }
//     } catch (error) {
//         console.log(error.message);
//         // Handle error if necessary
//     }
// }
const isLogOut = async (req, res, next) => {
    try {
        if (req.session.user) {
            // If user is already logged in, redirect to home page
            return res.redirect("/");
        }
        next();
    } catch (error) {
        console.log(error.message);
        next(error); // Pass the error to the next middleware
    }
}

const isLogin = async (req, res, next) => {
    try {
        if (req.session.user) {
            next(); // Proceed if logged in
        } else {
            res.redirect("/login"); // Redirect if not logged in
        }
    } catch (error) {
        console.log(error.message);
        next(error); // Pass the error to the next middleware
    }
}


module.exports = {
    isLogOut,
    isLogin
}
