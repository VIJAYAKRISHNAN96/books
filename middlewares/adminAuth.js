const isLogOut = async (req, res, next) => {
    try {
        if (req.session.adminSession) {
            res.redirect("/admin/dashboard")
        } else {
            next();
        }
    } catch (error) {
        console.log(error.message)
    }
}

const isLogin = async (req, res, next) => {
    try {
        if (req.session.adminSession) {
            next()
        } else {
            res.redirect("/admin/adminlogin")
        }
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    isLogOut,
    isLogin
}

// const isLogOut = async (req, res, next) => {
//     console.log("isLogOut middleware triggered");
//     console.log("Session:", req.session);
//     try {
//         if (req.session.adminSession) {
//             console.log("Admin session found, redirecting to dashboard");
//             res.redirect("/admin/dashboard")
//         } else {
//             console.log("No admin session, proceeding to next middleware");
//             next();
//         }
//     } catch (error) {
//         console.log("Error in isLogOut middleware:", error.message)
//     }
// }

// const isLogin = async (req, res, next) => {
//     console.log("isLogin middleware triggered");
//     console.log("Session:", req.session);
//     try {
//         if (req.session.adminSession) {
//             console.log("Admin session found, proceeding to next middleware");
//             next()
//         } else {
//             console.log("No admin session, redirecting to login");
//             res.redirect("/admin/adminlogin")
//         }
//     } catch (error) {
//         console.log("Error in isLogin middleware:", error.message)
//     }
// }

// module.exports = {
//     isLogOut,
//     isLogin
// }