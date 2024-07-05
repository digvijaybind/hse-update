const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');
const { isValidEmail } = require('../../../utils/regexs/emailRegex');
const { isDateValid } = require('../../../utils/regexs/dateRegex');
const { isPasswordValid } = require('../../../utils/regexs/passwordRegex');
const prisma = new PrismaClient();
const argon = require('argon2');
const { isValidMobileNumber } = require('../../../utils/regexs/phoneNumberRegex');

const updateInvestorPersonalProfile = asyncHandler(async (req, res) => {
  try {
    const { id } = req.investor;
    let { emailId, mobileNumber, dateofBirth, investmentPreference } = req.body;

    if (
      !emailId
      || !mobileNumber 
      || !dateofBirth 
      || !investmentPreference 
    ) {
      return res.status(400).json({ msg: "All fields are required!"});
    }

    emailId = emailId.trim();
    mobileNumber = mobileNumber.trim();
    dateofBirth = dateofBirth.trim();
    investmentPreference = investmentPreference.trim();

    if (
      emailId == '' ||
      mobileNumber == '' ||
      dateofBirth == '' ||
      investmentPreference == ''
    ) {
      return res.json({
        success: false,
        msg: 'Empty Input Fields!',
      });
    }
    
    if (!isValidEmail(emailId)) {
      return res.json({
        success: false,
        msg: 'Invalid email entered',
      });
    }
    
    if (!isValidMobileNumber(mobileNumber)) {
      return res.json({
        success: false,
        msg: 'Invalid mobile number entered',
      });
    }
    
    if (!isDateValid(dateofBirth)) {
      return res.json({
        success: false,
        msg: 'Invalid dateofBirth entered',
      });
    }

    const InvestorsIdToken = await prisma.Investor.update({
      where: {
        id,
      },
      data: {
        emailId,
        mobileNumber,
        dateofBirth: new Date(dateofBirth),
        investmentPreference,
      },
    });
    return res.json(InvestorsIdToken);
    
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});

const updateInvestorAddressProfileInfo = asyncHandler(async (req, res) => {
  try {
    const { id } = req.investor;
    let { addressOne, addressTwo, addressThree, pinCode, state, city } =
      req.body;

    if (
      !addressOne 
      || !addressTwo 
      || !addressThree 
      || !pinCode 
      || !state 
      || !city 
    ) {
      return res.status(400).json({ msg: "All fields are required!"});
    }
    addressOne = addressOne.trim();
    addressTwo = addressTwo.trim();
    addressThree = addressThree.trim();
    pinCode = pinCode.trim();
    state = state.trim();
    city = city.trim();
    if (
      addressOne == '' ||
      addressTwo == '' ||
      addressThree == '' ||
      pinCode == '' ||
      state == '' ||
      city == ''
    ) {
      res.json({
        success: false,
        msg: 'Empty Input Fields!',
      });
    } else {
      const InvestorsIdToken = await prisma.Investor.update({
        where: {
          id,
        }, 
        data: {
          addressOne,
          addressTwo,
          addressThree,
          pinCode,
          state,
          city,
        },
      });
      res.json(InvestorsIdToken);
    }
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});

const changeInvestorPassword = asyncHandler(async (req, res) => {
  try {
    const { id } = req.investor;
    let { formerPassword, newPassword, confirmNewPassword } = req.body;

    if (!formerPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ msg: "All fields are required!"});
    }

    formerPassword = formerPassword.trim();
    newPassword = newPassword.trim();
    confirmNewPassword = confirmNewPassword.trim();

    if (formerPassword == '' || newPassword == '' || confirmNewPassword == '') {
      res.json({
        success: false,
        msg: 'Empty Input Fields!',
      });
    } else if (
      !isPasswordValid(formerPassword) ||
      !isPasswordValid(newPassword) ||
      !isPasswordValid(confirmNewPassword)
    ) {
      res.json({
        success: false,
        msg: 'Invalid password entered',
      });
    } else {
      const newPasswordHash = await argon.hash(newPassword);

      const formerPasswordOwnerExist = await prisma.Investor.findUnique({
        where: {
          id,
        },
      });

      const pwMatches = await argon.verify(
        formerPasswordOwnerExist.password,
        formerPassword
      );
      if (!pwMatches) {
        res.json({
          success: false,
          msg: 'formerPassword does not exist try to reset formerPassword before trying to change Password',
        });
      } else if (newPassword !== confirmNewPassword) {
        res.json({
          success: false,
          msg: 'newPassword didnt match confirmNewPassword',
        });
      } else {
        const InvestorswithPassword = await prisma.Investor.update({
          where: {
            id,
          },
          data: {
            password: newPasswordHash,
          },
        });
        res.json({
          msg: 'Password Change successfully',
          data: InvestorswithPassword,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});

const deactivateInvestorAccount = asyncHandler(async (req, res) => {
  try {
    const { id } = req.investor;
    const { accountDeactivate } = req.body;
    if (accountDeactivate === null) {
      res.json({
        success: false,
        msg: 'Empty Input Fields!',
      });
    } else {
      const deactivateAccount = await prisma.Investor.delete({
        where: {
          id,
        },
      });
      res.json({
        msg: 'Account Delete successfully By deactivating You',
        note: 'By deactivating your Account you totally deleted your account and you cant login or do anything with this account',
        data: deactivateAccount,
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});

const TurnOnNotificationInvestorSettings = asyncHandler(async (req, res) => {
  try {
    let text;
    const { id } = req.investor;
    const { receiveNotification } = req.body;

    if (!receiveNotification) {
      return res.status(400).json({ msg: "All fields are required!"});
    }

    // console.log({receiveNotification});
    const receiveNotificationBooleanValue =  /^true$/i.test(receiveNotification);

    if (receiveNotificationBooleanValue === false) {
      text = 'off';
      console.log('This text', text);
    } else if (receiveNotificationBooleanValue === true) {
      text = 'on';
      console.log('This text', text);
    }

    const turnOffNotification = await prisma.Investor.update({
      where: {
        id,
      },
      data: {
        receiveNotification: receiveNotificationBooleanValue,
      },
    });

    // console.log(turnOffNotification);
    return res.json({
      msg: `Notification Turned ${text} successfully`,
      data: turnOffNotification,
    });
    
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});

const getProfileDetails = asyncHandler(async (req, res) => {
  try {
    const { id } = req.investor; 

    const getSingleTeamMember = await prisma.Investor.findUnique({
      where: {
        id,
      },
    });
    let data = {
      fullName: getSingleTeamMember.fullName,
      emailId: getSingleTeamMember.emailId,
      mobileNumber: getSingleTeamMember.mobileNumber,
      dateofBirth: getSingleTeamMember.dateofBirth,
    };
    res.json({
      data: data,
    });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});

module.exports = {
  updateInvestorPersonalProfile,
  updateInvestorAddressProfileInfo,
  changeInvestorPassword,
  deactivateInvestorAccount,
  TurnOnNotificationInvestorSettings,
  getProfileDetails,
};
