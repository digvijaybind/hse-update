// Import necessary modules and utilities
const {PrismaClient} = require("@prisma/client");
const asyncHandler = require("express-async-handler");
const {isValidEmail} = require("../../../utils/regexs/emailRegex");
const {isDateValid} = require("../../../utils/regexs/dateRegex");
const {isPasswordValid} = require("../../../utils/regexs/passwordRegex");
const prisma = new PrismaClient();
const argon = require("argon2");
const {isValidMobileNumber} = require("../../../utils/regexs/phoneNumberRegex");

// Update investor's personal profile handler
const updateInvestorPersonalProfile = asyncHandler(async (req, res) => {
  try {
    const {id} = req.investor;
    let {emailId, mobileNumber, dateofBirth, investmentPreference} = req.body;

    // Validate required fields
    if (!emailId || !mobileNumber || !dateofBirth || !investmentPreference) {
      return res.status(400).json({msg: "All fields are required!"});
    }

    // Trim whitespace from inputs
    emailId = emailId.trim();
    mobileNumber = mobileNumber.trim();
    dateofBirth = dateofBirth.trim();
    investmentPreference = investmentPreference.trim();

    // Check for empty input fields
    if (
      emailId === "" ||
      mobileNumber === "" ||
      dateofBirth === "" ||
      investmentPreference === ""
    ) {
      return res.json({success: false, msg: "Empty Input Fields!"});
    }

    // Validate email format
    if (!isValidEmail(emailId)) {
      return res.json({success: false, msg: "Invalid email entered"});
    }

    // Validate mobile number format
    if (!isValidMobileNumber(mobileNumber)) {
      return res.json({success: false, msg: "Invalid mobile number entered"});
    }

    // Validate date format
    if (!isDateValid(dateofBirth)) {
      return res.json({success: false, msg: "Invalid date of birth entered"});
    }

    // Update investor's profile in the database
    const updatedInvestor = await prisma.Investor.update({
      where: {id},
      data: {
        emailId,
        mobileNumber,
        dateofBirth: new Date(dateofBirth),
        investmentPreference,
      },
    });

    // Return updated investor profile
    return res.json(updatedInvestor);
  } catch (error) {
    // Handle server errors
    return res.status(500).json({error});
  }
});

// Update investor's address profile handler
const updateInvestorAddressProfileInfo = asyncHandler(async (req, res) => {
  try {
    const {id} = req.investor;
    let {addressOne, addressTwo, addressThree, pinCode, state, city} = req.body;

    // Validate required fields
    if (
      !addressOne ||
      !addressTwo ||
      !addressThree ||
      !pinCode ||
      !state ||
      !city
    ) {
      return res.status(400).json({msg: "All fields are required!"});
    }

    // Trim whitespace from inputs
    addressOne = addressOne.trim();
    addressTwo = addressTwo.trim();
    addressThree = addressThree.trim();
    pinCode = pinCode.trim();
    state = state.trim();
    city = city.trim();

    // Check for empty input fields
    if (
      addressOne === "" ||
      addressTwo === "" ||
      addressThree === "" ||
      pinCode === "" ||
      state === "" ||
      city === ""
    ) {
      return res.json({success: false, msg: "Empty Input Fields!"});
    }

    // Update investor's address profile in the database
    const updatedAddress = await prisma.Investor.update({
      where: {id},
      data: {addressOne, addressTwo, addressThree, pinCode, state, city},
    });

    // Return updated address profile
    return res.json(updatedAddress);
  } catch (error) {
    // Handle server errors
    return res.status(500).json({error});
  }
});

// Change investor's password handler
const changeInvestorPassword = asyncHandler(async (req, res) => {
  try {
    const {id} = req.investor;
    let {formerPassword, newPassword, confirmNewPassword} = req.body;

    // Validate required fields
    if (!formerPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({msg: "All fields are required!"});
    }

    // Trim whitespace from inputs
    formerPassword = formerPassword.trim();
    newPassword = newPassword.trim();
    confirmNewPassword = confirmNewPassword.trim();

    // Check for empty input fields
    if (
      formerPassword === "" ||
      newPassword === "" ||
      confirmNewPassword === ""
    ) {
      return res.json({success: false, msg: "Empty Input Fields!"});
    }

    // Validate password format
    if (
      !isPasswordValid(formerPassword) ||
      !isPasswordValid(newPassword) ||
      !isPasswordValid(confirmNewPassword)
    ) {
      return res.json({success: false, msg: "Invalid password entered"});
    }

    // Hash new password
    const newPasswordHash = await argon.hash(newPassword);

    // Retrieve investor's current password hash from database
    const investor = await prisma.Investor.findUnique({where: {id}});
    const pwMatches = await argon.verify(investor.password, formerPassword);

    // Verify former password
    if (!pwMatches) {
      return res.json({success: false, msg: "Former password does not match"});
    }

    // Check if new passwords match
    if (newPassword !== confirmNewPassword) {
      return res.json({success: false, msg: "New passwords do not match"});
    }

    // Update investor's password in the database
    const updatedInvestor = await prisma.Investor.update({
      where: {id},
      data: {password: newPasswordHash},
    });

    // Return success message and updated investor data
    return res.json({
      msg: "Password changed successfully",
      data: updatedInvestor,
    });
  } catch (error) {
    // Handle server errors
    return res.status(500).json({error});
  }
});

// Deactivate investor's account handler
const deactivateInvestorAccount = asyncHandler(async (req, res) => {
  try {
    const {id} = req.investor;
    const {accountDeactivate} = req.body;

    // Check if account deactivation field is provided
    if (accountDeactivate === null) {
      return res.json({success: false, msg: "Empty Input Fields!"});
    }

    // Delete investor's account from database
    const deletedAccount = await prisma.Investor.delete({
      where: {id},
    });

    // Return success message and additional information
    return res.json({
      msg: "Account deleted successfully",
      note: "By deactivating your account, it is permanently deleted and you cannot log in or use this account.",
      data: deletedAccount,
    });
  } catch (error) {
    // Handle server errors
    return res.status(500).json({error});
  }
});

// Toggle investor's notification settings handler
const TurnOnNotificationInvestorSettings = asyncHandler(async (req, res) => {
  try {
    const {id} = req.investor;
    const {receiveNotification} = req.body;

    // Check if receiveNotification field is provided
    if (!receiveNotification) {
      return res.status(400).json({msg: "All fields are required!"});
    }

    // Convert string input to boolean
    const receiveNotificationBoolean = /^true$/i.test(receiveNotification);
    const notificationStatus = receiveNotificationBoolean ? "on" : "off";

    // Update investor's notification settings in database
    const updatedNotificationSettings = await prisma.Investor.update({
      where: {id},
      data: {receiveNotification: receiveNotificationBoolean},
    });

    // Return success message and updated notification settings
    return res.json({
      msg: `Notification turned ${notificationStatus} successfully`,
      data: updatedNotificationSettings,
    });
  } catch (error) {
    // Handle server errors
    return res.status(500).json({error});
  }
});

// Get investor's profile details handler
const getProfileDetails = asyncHandler(async (req, res) => {
  try {
    const {id} = req.investor;

    // Fetch investor's profile details from database
    const investor = await prisma.Investor.findUnique({where: {id}});

    // Extract necessary profile data
    const data = {
      fullName: investor.fullName,
      emailId: investor.emailId,
      mobileNumber: investor.mobileNumber,
      dateofBirth: investor.dateofBirth,
    };

    // Return profile data
    return res.json({data});
  } catch (error) {
    // Handle server errors
    return res.status(500).json({error});
  }
});

// Export all handlers for use in other parts of the application
module.exports = {
  updateInvestorPersonalProfile,
  updateInvestorAddressProfileInfo,
  changeInvestorPassword,
  deactivateInvestorAccount,
  TurnOnNotificationInvestorSettings,
  getProfileDetails,
};
