const express = require("express");
const router = express.Router();
const {
  InvestorAuthMiddleware,
  AdminAuthMiddleware,
  isAdmin,
} = require("../middlewares/authMiddleware");
const {
  createInvestor,
  setPassword,
  loginInvestor,
  updateInvestorEmploymentKyc,
  updateInvestorAnnualIncomeKyc,
  uploadSelfieKyc,
  addressKyc,
  refreshToken,
  sendPhoneNumberOtp,
  sendEmailAddressOtp,
  verifyEmailAddressOtp,
  verifyMobileNumberOtp,
  logOut,
} = require("../controller/investor/investor");
const {
  updateInvestorPersonalProfile,
  updateInvestorAddressProfileInfo,
  changeInvestorPassword,
  deactivateInvestorAccount,
  TurnOnNotificationInvestorSettings,
  getProfileDetails,
} = require("../controller/investor/investorProfile/profile");
const {
  createAdmin,
  loginAdmin,
  createProperty,
  getAllInvestorOnPropertyById,
} = require("../controller/admin/admin");
const {investInProperty} = require("../controller/investor/InvestOnProperty");
const {
  bookMarkProperty,
  getAllMyBookMarked,
} = require("../controller/investor/bookMarkProperty");

/**
 * @route POST /investor/SignUp
 * @description Endpoint for investor registration
 * @access Public
 */
router.post("/investor/SignUp", createInvestor);

/**
 * @route POST /investor/SetPassword
 * @description Endpoint for setting investor password
 * @access Public
 */
router.post("/investor/SetPassword", setPassword);

/**
 * @route POST /investor/SignIn
 * @description Endpoint for investor login
 * @access Public
 */
router.post("/investor/SignIn", loginInvestor);

/**
 * @route POST /investor/SignOut
 * @description Endpoint for investor logout
 * @access Private
 */
router.post("/investor/SignOut", logOut);

/**
 * @route POST /investor/refreshToken
 * @description Endpoint for refreshing authentication token
 * @access Private
 */
router.post("/investor/refreshToken", refreshToken);

/**
 * @route POST /investor/sendEmailAddressOtp
 * @description Endpoint to send OTP to email address for verification
 * @access Private (requires investor authentication)
 */
router.post(
  "/investor/sendEmailAddressOtp",
  InvestorAuthMiddleware,
  sendEmailAddressOtp
);

/**
 * @route POST /investor/sendPhoneNumberOtp
 * @description Endpoint to send OTP to phone number for verification
 * @access Private (requires investor authentication)
 */
router.post(
  "/investor/sendPhoneNumberOtp",
  InvestorAuthMiddleware,
  sendPhoneNumberOtp
);

/**
 * @route POST /investor/verifyPhoneNumberOtp
 * @description Endpoint to verify phone number OTP
 * @access Private (requires investor authentication)
 */
router.post(
  "/investor/verifyPhoneNumberOtp",
  InvestorAuthMiddleware,
  verifyMobileNumberOtp
);

/**
 * @route POST /investor/verifyEmailAddressOtp
 * @description Endpoint to verify email address OTP
 * @access Private (requires investor authentication)
 */
router.post(
  "/investor/verifyEmailAddressOtp",
  InvestorAuthMiddleware,
  verifyEmailAddressOtp
);

/**
 * @route POST /investor/UpdateInvestorEmploymentKyc
 * @description Endpoint to update employment KYC information
 * @access Private (requires investor authentication)
 */
router.post(
  "/investor/UpdateInvestorEmploymentKyc",
  InvestorAuthMiddleware,
  updateInvestorEmploymentKyc
);

/**
 * @route POST /investor/UpdateInvestorAnnualIncomeKyc
 * @description Endpoint to update annual income KYC information
 * @access Private (requires investor authentication)
 */
router.post(
  "/investor/UpdateInvestorAnnualIncomeKyc",
  InvestorAuthMiddleware,
  updateInvestorAnnualIncomeKyc
);

/**
 * @route POST /investor/UpdateInvestorSelfieKyc
 * @description Endpoint to upload a selfie for KYC verification
 * @access Private (requires investor authentication)
 */
router.post(
  "/investor/UpdateInvestorSelfieKyc",
  InvestorAuthMiddleware,
  uploadSelfieKyc
);

/**
 * @route POST /investor/UpdateInvestorAddressKyc
 * @description Endpoint to update address KYC information
 * @access Private (requires investor authentication)
 */
router.post(
  "/investor/UpdateInvestorAddressKyc",
  InvestorAuthMiddleware,
  addressKyc
);

/**
 * @route POST /investor/personalProfile
 * @description Endpoint to update personal profile information
 * @access Private (requires investor authentication)
 */
router.post(
  "/investor/personalProfile",
  InvestorAuthMiddleware,
  updateInvestorPersonalProfile
);

/**
 * @route POST /investor/profileAddressInfo
 * @description Endpoint to update address profile information
 * @access Private (requires investor authentication)
 */
router.post(
  "/investor/profileAddressInfo",
  InvestorAuthMiddleware,
  updateInvestorAddressProfileInfo
);

/**
 * @route POST /investor/settings/changePassword
 * @description Endpoint to change investor password
 * @access Private (requires investor authentication)
 */
router.post(
  "/investor/settings/changePassword",
  InvestorAuthMiddleware,
  changeInvestorPassword
);

/**
 * @route DELETE /investor/settings/deactivateInvestorAccount
 * @description Endpoint to deactivate investor account
 * @access Private (requires investor authentication)
 */
router.delete(
  "/investor/settings/deactivateInvestorAccount",
  InvestorAuthMiddleware,
  deactivateInvestorAccount
);

/**
 * @route PUT /investor/settings/enableInvestorToReceiveNotification
 * @description Endpoint to enable notifications for investor
 * @access Private (requires investor authentication)
 */
router.put(
  "/investor/settings/enableInvestorToReceiveNotification",
  InvestorAuthMiddleware,
  TurnOnNotificationInvestorSettings
);

/**
 * @route GET /investor/settings/getMyProfileDetails
 * @description Endpoint to get investor profile details
 * @access Private (requires investor authentication)
 */
router.get(
  "/investor/settings/getMyProfileDetails",
  InvestorAuthMiddleware,
  getProfileDetails
);

/**
 * @route POST /investor/property/bookmark
 * @description Endpoint to bookmark a property
 * @access Private (requires investor authentication)
 */
router.post(
  "/investor/property/bookmark",
  InvestorAuthMiddleware,
  bookMarkProperty
);

/**
 * @route GET /investor/id/bookmark
 * @description Endpoint to get all bookmarked properties of an investor
 * @access Private (requires investor authentication)
 */
router.get("/investor/id/bookmark", InvestorAuthMiddleware, getAllMyBookMarked);

// Admin Endpoints
/**
 * @route POST /admin/SignUp
 * @description Endpoint for admin registration
 * @access Public
 */
router.post("/admin/SignUp", createAdmin);

/**
 * @route POST /admin/SignIn
 * @description Endpoint for admin login
 * @access Public
 */
router.post("/admin/SignIn", loginAdmin);

/**
 * @route POST /admin/create-Property
 * @description Endpoint to create a new property
 * @access Private (requires admin authentication and admin privileges)
 */
router.post(
  "/admin/create-Property",
  AdminAuthMiddleware,
  isAdmin,
  createProperty
);

/**
 * @route GET /admin/getAllInvestorOnPropertyById
 * @description Endpoint to get all investors on a property by ID
 * @access Private (requires admin authentication and admin privileges)
 */
router.get(
  "/admin/getAllInvestorOnPropertyById",
  AdminAuthMiddleware,
  isAdmin,
  getAllInvestorOnPropertyById
);

/**
 * @route POST /investor/invest-In-Property
 * @description Endpoint for investing in a property
 * @access Private (requires investor authentication)
 */
router.post(
  "/investor/invest-In-Property",
  InvestorAuthMiddleware,
  investInProperty
);

module.exports = router;
