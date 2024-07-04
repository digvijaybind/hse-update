const { PrismaClient, Role } = require('@prisma/client');
const asyncHandler = require('express-async-handler');
const { superBase } = require('../../config/supabse');
const path = require('path');
const { generateAccessToken } = require('../../config/jwtToken');
const argon = require('argon2');
const prisma = new PrismaClient();
const multer = require('multer');
const { isValidEmail } = require('../../utils/regexs/emailRegex');
const { isPasswordValid } = require('../../utils/regexs/passwordRegex');
const { log } = require('console');

const storage = multer.memoryStorage(); // Use memory storage for multer
const optionalFields = ['propertyVideoPath', 'otherDocumentPath'];
const upload = multer({ storage: storage }).fields(
  [
    { name: 'propertyImagePath', maxCount: 1 },
    { name: 'propertyAmmenitiesImagePath', maxCount: 1 },
    { name: 'titleDeedDocumentPath', maxCount: 1 },
    { name: 'floorLayoutDocumentPath', maxCount: 1 },
    { name: 'companyDetailsDocumentPath', maxCount: 1 },
    { name: 'ownerShipDocumentPath', maxCount: 1 },
  ].concat(
    optionalFields.map((fieldName) => ({
      name: fieldName,
      maxCount: 1,
    }))
  )
);

const createAdmin = asyncHandler(async (req, res) => {
  try {
    let { name, email, password } = req.body;
    name = name.trim();
    email = email.trim();

    if (name == '' || email == '' || password == '') {
      res.json({
        success: false,
        msg: 'Empty Input Fields!',
      });
    } else if (!isValidEmail(email)) {
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
    } else {
      const findAdmin = await prisma.Admin.findUnique({
        where: {
          email,
        },
      });
      if (findAdmin === null) {
        const hash = await argon.hash(password);
        const Admin = await prisma.Admin.create({
          data: {
            name: name,
            email: email,
            password: hash,
            role: Role.ADMIN,
          },
        });
        res.json(Admin);
      } else {
        res.json({
          msg: 'Admin Already Exists',
          success: false,
        });
      }
    }
  } catch (error) {
    res.json({
      msg: error,
      success: false,
    });
  }
});

const loginAdmin = asyncHandler(async (req, res) => {
  let { email, password } = req.body;
  try {
    email = email.trim();
    password = password.trim();
    if (email == '' || password == '') {
      res.json({
        success: false,
        msg: 'Empty Input Fields!',
      });
    } else if (!isValidEmail(email)) {
      res.json({
        success: false,
        msg: 'Invalid email entered',
      });
    } else {
      const findAdminByEmail = await prisma.Admin.findUnique({
        where: {
          email: email,
        },
      });
      const pwMatches = await argon.verify(findAdminByEmail.password, password);
      if (findAdminByEmail && pwMatches) {
        res.json({
          id: findAdminByEmail?.id,
          email: findAdminByEmail?.email,
          password: findAdminByEmail?.password,
          name: findAdminByEmail?.name,
          role: findAdminByEmail.role,
          token: generateAccessToken(findAdminByEmail?.id),
        });
        return;
      } else {
        // console.log("error invCred");
        throw new Error('Invalid Credentials');
      }
    }
  } catch (error) {
    console.log(error, "error here");
    return res.status(500).json({ error: error });
  }
});

const createProperty = asyncHandler(async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        console.error(err);
        return res.status(400).json({ error: 'File upload failed' });
      }

      // Check if req.file contains the uploaded file information
      console.log(req.file);
      let {
        propertyName,
        propertyLocation,
        totalAssetValue,
        totalToken,
        lockPeriod,
        aboutTotalAssetValue,
        sharedType,
        aboutSharedType,
        holdingCompany,
        aboutHoldingCompany,
        aboutProperty,
        faqs,
      } = req.body;

      if (
        !propertyName ||
        (propertyName == '' && !propertyLocation) ||
        (propertyLocation == '' &&
          !totalAssetValue &&
          !totalToken &&
          !aboutTotalAssetValue &&
          !sharedType &&
          !aboutSharedType &&
          !holdingCompany &&
          !aboutHoldingCompany &&
          !aboutProperty &&
          !faqs)
      ) {
        res.json({
          success: false,
          msg: 'Empty Input Fields!',
        });
      } else {
        const imageTypes = [
          'propertyImagePath',
          'propertyVideoPath',
          'propertyAmmenitiesImagePath',
          'titleDeedDocumentPath',
          'floorLayoutDocumentPath',
          'companyDetailsDocumentPath',
          'ownerShipDocumentPath',
          'otherDocumentPath',
        ];

        const imageUrls = {};

        for (const imageType of imageTypes) {
          if (req.files[imageType]) {
            const imageFile = req.files[imageType][0];
            const imageBuffer = imageFile.buffer;
            const imageContentType = imageFile.mimetype;
            const originalFilename = imageFile.originalname;

            const { data, error } = await superBase.storage
              .from('gallery')
              .upload(originalFilename, imageBuffer, {
                cacheControl: '3600',
                upsert: false,
                contentType: imageContentType,
              });

            if (error) {
              console.error(error);
              return res.status(500).json({ error: 'File upload failed' });
            }

            const imageUrlPath = data.path;

            const imageUrl = await superBase.storage
              .from('gallery')
              .getPublicUrl(imageUrlPath);

            imageUrls[imageType] = imageUrl.data.publicUrl;
            console.log(imageUrls);
          }
        }

        if (
          !imageUrls.propertyImagePath &&
          !imageUrls.propertyAmmenitiesImagePath &&
          !imageUrls.titleDeedDocumentPath &&
          !imageUrls.floorLayoutDocumentPath &&
          !imageUrls.companyDetailsDocumentPath &&
          !imageUrls.ownerShipDocumentPath
        ) {
          return res.status(500).json({ error: 'File upload failed' });
        }

        const property = await prisma.Property.create({
          data: {
            propertyName,
            propertyLocation,
            totalAssetValue,
            totalAssetValueLeft: totalAssetValue,
            totalToken,
            tokenLeft: totalToken,
            lockPeriod,
            aboutTotalAssetValue,
            sharedType,
            aboutSharedType,
            holdingCompany,
            aboutHoldingCompany,
            aboutProperty,
            faqs,
            propertyImagePath: imageUrls.propertyImagePath,
            propertyAmmenitiesImagePath: imageUrls.propertyAmmenitiesImagePath,
            titleDeedDocumentPath: imageUrls.titleDeedDocumentPath,
            floorLayoutDocumentPath: imageUrls.floorLayoutDocumentPath,
            companyDetailsDocumentPath: imageUrls.companyDetailsDocumentPath,
            ownerShipDocumentPath: imageUrls.ownerShipDocumentPath,
            // Handle optional file fields
            ...(req.files.propertyVideoPath && {
              propertyVideoPath: imageUrls.propertyVideoPath,
            }),
            ...(req.files.otherDocumentPath && {
              otherDocumentPath: imageUrls.otherDocumentPath,
            }),
          },
        });
        res.json({
          success: true,
          msg: property,
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

const getAllInvestorOnPropertyById = asyncHandler(async (req, res) => {
  const { propertyId } = req.body;

  if (propertyId === null || undefined) {
    res.json({
      success: false,
      msg: 'propertyId is required',
    });
  }

  try {
    const propertyInvestors = await prisma.PropertyInvestor.findMany({
      where: { propertyId: propertyId },
      include: { investor: true },
    });

    if (!propertyInvestors.length) {
      return res.json({
        success: false,
        msg: 'No investors found for this property',
      });
    }

    // Filter out duplicate investors
    const uniqueInvestors = propertyInvestors.reduce((acc, pi) => {
      if (!acc.some((inv) => inv.id === pi.investor.id)) {
        acc.push(pi.investor);
      }
      return acc;
    }, []);

    res.json({
      success: true,
      msg: 'Investors fetched successfully!',
      investors: uniqueInvestors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Request failed' });
  }
});

module.exports = {
  createAdmin,
  loginAdmin,
  createProperty,
  getAllInvestorOnPropertyById,
};
