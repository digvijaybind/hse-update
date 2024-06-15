const express = require('express');
const router = express.Router();
const {
  InvestorAuthMiddleware,
  AdminAuthMiddleware,
  isAdmin,
} = require('../middlewares/authMiddleware');
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
} = require('../controller/investor/investor');
const {
  updateInvestorPersonalProfile,
  updateInvestorAddressProfileInfo,
  changeInvestorPassword,
  deactivateInvestorAccount,
  TurnOnNotificationInvestorSettings,
  getProfileDetails,
} = require('../controller/investor/investorProfile/profile');

const {
  createAdmin,
  loginAdmin,
  createProperty,
  getAllInvestorOnPropertyById,
} = require('../controller/admin/admin');

const { investInProperty } = require('../controller/investor/InvestOnProperty');
const {
  bookMarkProperty,
  getAllMyBookMarked,
} = require('../controller/investor/bookMarkProperty');

router.post('/investor/SignUp', createInvestor);
router.post('/investor/SetPassword', setPassword);
router.post('/investor/SignIn', loginInvestor);
router.post('/investor/refreshToken', refreshToken);
router.post(
  '/investor/sendEmailAddressOtp',
  InvestorAuthMiddleware,
  sendEmailAddressOtp
);
router.post(
  '/investor/sendPhoneNumberOtp',
  InvestorAuthMiddleware,
  sendPhoneNumberOtp
);
router.post(
  '/investor/verifyPhoneNumberOtp',
  InvestorAuthMiddleware,
  verifyMobileNumberOtp
);
router.post(
  '/investor/verifyEmailAddressOtp',
  InvestorAuthMiddleware,
  verifyEmailAddressOtp
);
router.post(
  '/investor/UpdateInvestorEmploymentKyc',
  InvestorAuthMiddleware,
  updateInvestorEmploymentKyc
);
router.post(
  '/investor/UpdateInvestorAnnualIncomeKyc',
  InvestorAuthMiddleware,
  updateInvestorAnnualIncomeKyc
);
router.post(
  '/investor/UpdateInvestorSelfieKyc',
  InvestorAuthMiddleware,
  uploadSelfieKyc
);
router.post(
  '/investor/UpdateInvestorAddressKyc',
  InvestorAuthMiddleware,
  uploadSelfieKyc
);
router.post(
  '/investor/personalProfile',
  InvestorAuthMiddleware,
  updateInvestorPersonalProfile
);
router.post(
  '/investor/profileAddressInfo',
  InvestorAuthMiddleware,
  updateInvestorAddressProfileInfo
);
router.post(
  '/investor/settings/changePassword',
  InvestorAuthMiddleware,
  changeInvestorPassword
);
router.delete(
  '/investor/settings/deactivateInvestorAccount',
  InvestorAuthMiddleware,
  deactivateInvestorAccount
);

router.put(
  '/investor/settings/enableInvestorToReceiveNotification',
  InvestorAuthMiddleware,
  TurnOnNotificationInvestorSettings
);

router.get(
  '/investor/settings/getMyProfileDetails',
  InvestorAuthMiddleware,
  getProfileDetails
);
router.post(
  '/investor/property/bookmark',
  InvestorAuthMiddleware,
  bookMarkProperty
);
router.get('/investor/id/bookmark', InvestorAuthMiddleware, getAllMyBookMarked);

//Admin

router.post('/admin/SignUp', createAdmin);
router.post('/admin/SignIn', loginAdmin);
router.post(
  '/admin/create-Property',
  AdminAuthMiddleware,
  isAdmin,
  createProperty
);
router.get(
  '/admin/getAllInvestorOnPropertyById',
  AdminAuthMiddleware,
  isAdmin,
  getAllInvestorOnPropertyById
);
router.post(
  '/investor/invest-In-Property',
  InvestorAuthMiddleware,
  investInProperty
);
module.exports = router;
