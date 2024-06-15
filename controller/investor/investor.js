const { PrismaClient, Role } = require('@prisma/client');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const { superBase } = require('../../config/supabse');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../../config/jwtToken');
const dotenv = require('dotenv');
dotenv.config();
const argon = require('argon2');
const prisma = new PrismaClient();
const multer = require('multer');

const { isValidEmail } = require('../../utils/regexs/emailRegex');
const { isDateValid } = require('../../utils/regexs/dateRegex');
const { isPasswordValid } = require('../../utils/regexs/passwordRegex');
const { isValidMobileNumber } = require('../../utils/regexs/phoneNumberRegex');

const SendchampService = require('../sendChamp/sendChampController');
const { OTPService } = require('../redis/nodeCacheService');

var request = require('request');

const storage = multer.memoryStorage(); // Use memory storage for multer
const upload = multer({ storage: storage }).single('selfieImagePath');

const createInvestor = asyncHandler(async (req, res) => {
  try {
    let { fullName, mobileNumber, dateofBirth, emailId } = req.body;
    fullName = fullName.trim();
    mobileNumber = mobileNumber.trim();
    dateofBirth = dateofBirth.trim();
    emailId = emailId.trim();
    if (
      fullName == '' ||
      mobileNumber == '' ||
      dateofBirth == '' ||
      emailId == ''
    ) {
      res.json({
        success: false,
        msg: 'Empty Input Fields!',
      });
    } else if (!isValidEmail(emailId)) {
      res.json({
        success: false,
        msg: 'Invalid emailId entered',
      });
    } else if (!isValidMobileNumber(mobileNumber)) {
      res.json({
        success: false,
        msg: 'Invalid phoneNumber must include country code i.e 2349050779526',
      });
    } else if (!isDateValid(dateofBirth)) {
      res.json({
        success: false,
        msg: 'Invalid dateofBirth entered',
      });
    } else {
      const findInvestor = await prisma.Investor.findUnique({
        where: {
          emailId,
        },
      });
      if (findInvestor === null) {
        // create a new Investor
        const Investor = await prisma.Investor.create({
          data: {
            fullName: fullName,
            mobileNumber: mobileNumber,
            dateofBirth: dateofBirth,
            emailId: emailId,
            role: Role.INVESTOR,
          },
        });
        const otpResponse = await SendchampService.sendEmailOTP({
          meta_data: 'test_meta',
          channel: 'email',
          sender: 'Sendchamp',
          token_type: 'numeric',
          token_length: 6,
          expiration_time: 5,
          customer_email_address: emailId,
        });
        console.log('OTP Response:', otpResponse);
        // Save OTP reference in Redis
        await OTPService.storeEmailIdOTP(otpResponse.data.data.reference);

        res.json({ Investor: Investor, SendChampResponse: otpResponse });
      } else {
        res.json({
          msg: 'Investor Already Exists',
          success: false,
        });
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'request failed', msg: error });
  }
});

//Update InvestorPasswordWith Password
const setPassword = asyncHandler(async (req, res) => {
  let { emailId, password, confirmPassword } = req.body;
  emailId = emailId.trim();
  password = password.trim();
  confirmPassword = confirmPassword.trim();
  if (emailId == '' || password == '' || confirmPassword == '') {
    res.json({
      success: false,
      msg: 'Empty Input Fields!',
    });
  } else if (!isValidEmail(emailId)) {
    res.json({
      success: false,
      msg: 'Invalid email entered',
    });
  } else if (!isPasswordValid(password)) {
    res.json({
      success: false,
      msg: 'Invalid password format check input passwords and try again',
      supportedFormat: 'must not greater than 6',
    });
  } else if (!isPasswordValid(confirmPassword)) {
    res.json({
      success: false,
      msg: 'Invalid password format check input passwords and try again',
      supportedFormat: 'must not greater than 6',
    });
  } else if (confirmPassword != password) {
    res.json({
      success: false,
      msg: 'Password Did not match confirmation Password Check and try again',
    });
  } else {
    try {
      const findInvestorWithAssociatedEmailId =
        await prisma.Investor.findUnique({
          where: {
            emailId: emailId,
          },
        });

      if (findInvestorWithAssociatedEmailId.emailId != emailId) {
        res.json({
          msg: 'No Investor With This Associated EmailId Cant setPassword',
          success: false,
        });
      } else if (findInvestorWithAssociatedEmailId.password != null) {
        res.json({
          msg: 'Password Already Set',
        });
      } else {
        const hash = await argon.hash(password);
        const pwMatches = await argon.verify(hash, confirmPassword);
        if (!pwMatches) {
          res.json({
            message: `Your ${password} did not match your ${confirmPassword}`,
          });
        } else {
          const InvestorsWithSetPassword = await prisma.Investor.update({
            where: {
              emailId: emailId,
            },
            data: {
              password: hash,
            },
          });

      
          res.json(InvestorsWithSetPassword);
        }
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'request failed', msg: error });
    }
  }
});

//Kyc
//KYC eMPLOYMENT DETAILS
const updateInvestorEmploymentKyc = asyncHandler(async (req, res) => {
  const { id } = req.investor;
  let { industry, organization, roleAtWork, workingDuration } = req.body;
  industry = industry.trim();
  organization = organization.trim();
  roleAtWork = roleAtWork.trim();
  workingDuration = workingDuration.trim();
  if (
    industry == '' ||
    organization == '' ||
    roleAtWork == '' ||
    workingDuration == ''
  ) {
    res.json({
      success: false,
      msg: 'Empty Input Fields!',
    });
  } else {
    try {
      const InvestorsWithUpdatedEmploymentDetails =
        await prisma.Investor.update({
          where: {
            id,
          },
          data: {
            industry,
            organization,
            roleAtWork,
            workingDuration,
          },
        });
      res.json(InvestorsWithUpdatedEmploymentDetails);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'request failed', msg: error });
    }
  }
});

// KYC Annuall inome

const updateInvestorAnnualIncomeKyc = asyncHandler(async (req, res) => {
  try {
    const { id } = req.investor;
    let { incomeRange } = req.body;
    incomeRange = incomeRange.trim();
    if (incomeRange == '') {
      res.json({
        success: false,
        msg: 'Empty Input Fields!',
      });
    } else {
      const InvestorsWithUpdatedAnnualIncome = await prisma.Investor.update({
        where: {
          id,
        },
        data: {
          incomeRange,
        },
      });
      res.json(InvestorsWithUpdatedAnnualIncome);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'request failed', msg: error });
  }
});

let refreshTokens = [];
const loginInvestor = asyncHandler(async (req, res) => {
  const { contact, password } = req.body;

  if (contact === null || (undefined && password === null) || undefined) {
    return res.json({
      success: false,
      msg: 'Contact and password fields are required',
    });
  }

  // Determine if contact is an email or phone number
  let isEmail = await isValidEmail(contact);
  console.log('is email 309', isEmail);
  let isPhoneNumber = await isValidMobileNumber(contact);
  console.log('is email 312', isPhoneNumber);

  if (!isEmail && !isPhoneNumber) {
    return res.json({
      success: false,
      msg: 'Invalid email or phone number format',
    });
  }

  // check if Admin exist
  try {
    let investor;
    if (isEmail === true) {
      investor = await prisma.Investor.findUnique({
        where: { emailId: contact },
      });
    } else if (isPhoneNumber === true) {
      investor = await prisma.Investor.findUnique({
        where: { mobileNumber: contact },
      });
    }

    if (!investor) {
      return res.status(404).json({
        error: 'Investor with such emailId or phoneNumber does not exist',
      });
    }
    const pwMatches = await argon.verify(investor?.password, password);
    if (!pwMatches) {
      return res.status(404).json({ error: 'Incorrect Password' });
    }

    const accessToken = generateAccessToken(investor.id);
    const refreshToken = generateRefreshToken(investor.id);
    refreshTokens.push(refreshToken);

    return res.json({
      id: investor.id,
      emailId: investor.emailId,
      mobileNumber: investor.mobileNumber,
      fullName: investor.fullName,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'request failed', msg: error });
  }
});

const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) return res.sendStatus(401);
  if (!refreshTokens.includes(token)) return res.sendStatus(403);

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);

    const accessToken = generateAccessToken(decoded?.id);
    console.log('This is acccess Token 370', accessToken);
    res.json({ accessToken });
  });
});

const logOut = asyncHandler(async (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((rt) => rt !== token);
  res.sendStatus(204);
});
//Kyc
//KYC Selfie Uploading

const uploadSelfieKyc = asyncHandler(async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        console.error(err);
        return res.status(400).json({ error: 'File upload failed' });
      }

      // Check if req.file contains the uploaded file information
      console.log(req.file);
      const { id } = req.investor;

      // }
      const findInvestorWithAssociatedSelfie = await prisma.investor.findUnique(
        {
          where: {
            id,
          },
        }
      );

      if (findInvestorWithAssociatedSelfie.selfieImagePath != null) {
        res.json({
          msg: 'selfieImagePath Already Uploaded',
        });
      } else if (findInvestorWithAssociatedSelfie.selfieImagePath === null) {
        try {
          const imageBuffer = req.file.buffer; // Get the image buffer
          const imageContentType = req.file.mimetype; // Get the image content type
          const originalFilename = req.file.originalname; // Get the original filename

          // Upload the image to Supabase storage with the correct content type and original filename
          const { data, error } = await superBase.storage
            .from('gallery')
            .upload(originalFilename, imageBuffer, {
              cacheControl: '3600',
              upsert: false,
              contentType: imageContentType, // Use the content type from the uploaded file
            });

          if (error) {
            console.error(error);
            return res.status(500).json({ error: 'File upload failed' });
          }
          const imageUrlPath = data.path;
          console.log(imageUrlPath);

          if (!imageUrlPath) {
            return res.status(500).json({ error: 'File upload failed' });
          }

          const imageUrl = await superBase.storage
            .from('gallery')
            .getPublicUrl(imageUrlPath);

          console.log(imageUrl);
          const InvestorWithUploadedSelfie = await prisma.Investor.update({
            where: {
              id,
            },
            data: {
              selfieImagePath: imageUrl.data.publicUrl,
            },
          });

          return res.json({
            msg: 'Selfie uploaded successfully',
            data: InvestorWithUploadedSelfie,
          });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ error: 'Server error' });
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'request failed', msg: error });
  }
});

const addressKyc = asyncHandler(async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        console.error(err);
        return res.status(400).json({ error: 'File upload failed' });
      }

      // Check if req.file contains the uploaded file information
      console.log(req.file);
      const { id } = req.investor;

      const findInvestorWithAssociatedAddress =
        await prisma.Investor.findUnique({
          where: {
            id,
          },
        });

      if (findInvestorWithAssociatedAddress.addressImagePath != null) {
        res.json({
          msg: 'addressImagePath Already Uploaded',
        });
      } else if ((findInvestorWithAssociatedAddress = null)) {
        try {
          const imageBuffer = req.file.buffer; // Get the image buffer
          const imageContentType = req.file.mimetype; // Get the image content type
          const originalFilename = req.file.originalname; // Get the original filename

          // Upload the image to Supabase storage with the correct content type and original filename
          const { data, error } = await superBase.storage
            .from('gallery')
            .upload(originalFilename, imageBuffer, {
              cacheControl: '3600',
              upsert: false,
              contentType: imageContentType, // Use the content type from the uploaded file
            });

          if (error) {
            console.error(error);
            return res.status(500).json({ error: 'File upload failed' });
          }
          const imageUrlPath = data.path;
          console.log(imageUrlPath);

          if (!imageUrlPath) {
            return res.status(500).json({ error: 'File upload failed' });
          }

          const imageUrl = await superBase.storage
            .from('gallery')
            .getPublicUrl(imageUrlPath);

          console.log(imageUrl);
          const InvestorWithUploadedAddress = await prisma.Investor.update({
            where: {
              id,
            },
            data: {
              addressImagePath: imageUrl.data.publicUrl,
            },
          });

          return res.json({
            msg: 'Address uploaded successfully',
            data: InvestorWithUploadedAddress,
          });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ error: 'Server error' });
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'request failed', msg: error });
  }
});

const sendPhoneNumberOtp = asyncHandler(async (req, res) => {
  const mobileNumber = req.investor.mobileNumber;
  try {
    const otpResponse = await SendchampService.sendMobileNumberOTP({
      meta_data: 'test_meta',
      channel: 'sms',
      sender: 'Sendchamp',
      token_type: 'numeric',
      token_length: 6,
      expiration_time: 5,
      customer_mobile_number: mobileNumber,
    });
    console.log('OTP Response:', otpResponse);
    await OTPService.storeMobileNumberOTP(otpResponse.data.data.reference);
    res.json({ SendChampResponse: otpResponse });
  } catch (error) {
    res.status(500).json({ error: 'request failed', msg: error });
  }
});

const sendEmailAddressOtp = asyncHandler(async (req, res) => {
  const emailId = req.investor.emailId;
  try {
    const otpResponse = await SendchampService.sendEmailOTP({
      meta_data: 'test_meta',
      channel: 'email',
      sender: 'Sendchamp',
      token_type: 'numeric',
      token_length: 6,
      expiration_time: 5,
      customer_email_address: emailId,
    });
    console.log('OTP Response:', otpResponse);
    await OTPService.storeEmailIdOTP(otpResponse.data.data.reference);
    res.json({ SendChampResponse: otpResponse });
  } catch (error) {
    console.log('erpoy 584', error);
    res.status(500).json({ error: 'request failed', msg: error });
  }
});

const verifyEmailAddressOtp = asyncHandler(async (req, res) => {
  const emailId = req.investor.emailId;
  const { verification_code } = req.body;
  try {
    const verification_reference = await OTPService.getOTPEmailIdReference(
      emailId
    );
    if (!verification_reference) {
      return res.status(400).json({ error: 'OTP has expired or is invalid' });
    }
    const verificationResponse = await SendchampService.confirmOTP({
      verification_reference,
      verification_code,
    });
    res.json({ VerificationResponse: verificationResponse });
  } catch (error) {
    console.log('error 619', error);
    res.status(500).json({ error: 'verification failed', msg: error });
  }
});

const verifyMobileNumberOtp = asyncHandler(async (req, res) => {
  const mobileNumber = req.investor.mobileNumber;
  const { verification_code } = req.body;
  try {
    const verification_reference = await OTPService.getMobileNumberOTPReference(
      mobileNumber
    );
    if (!verification_reference) {
      return res.status(400).json({ error: 'OTP has expired or is invalid' });
    }
    const verificationResponse = await SendchampService.confirmOTP({
      verification_reference,
      verification_code,
    });
    res.json({ VerificationResponse: verificationResponse });
  } catch (error) {
    console.log('error 619', error);
    res.status(500).json({ error: 'verification failed', msg: error });
  }
});
module.exports = {
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
};
