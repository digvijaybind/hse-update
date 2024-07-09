// Import required libraries and modules
const {PrismaClient} = require("@prisma/client"); // ORM for database operations
const asyncHandler = require("express-async-handler"); // Middleware to handle async operations and errors

// Load environment variables
const dotenv = require("dotenv");
dotenv.config();
const argon = require("argon2"); // Library for password hashing
const prisma = new PrismaClient(); // Initialize Prisma Client
const multer = require("multer"); // Middleware for handling multipart/form-data (file uploads)

// Async handler function to handle property investment
const investInProperty = asyncHandler(async (req, res) => {
  try {
    const investorId = req.investor.id; // Get investor ID from the request
    const {propertyId, amountInvested} = req.body; // Get property ID and amount invested from the request body

    // Check if required fields are present
    if (
      propertyId === null ||
      undefined ||
      investorId === null ||
      undefined ||
      amountInvested === null ||
      undefined
    ) {
      return res.json({
        success: false,
        msg: "Missing property or investor ID or amountInvested",
      });
    }

    // Fetch property, investor, and property investors data from the database
    const [property, investor, propertyInvestors] = await Promise.all([
      prisma.Property.findUnique({
        where: {id: propertyId},
      }),
      prisma.Investor.findUnique({
        where: {id: investorId},
      }),
      prisma.PropertyInvestor.findMany({
        where: {propertyId: propertyId},
        include: {investor: true, property: true},
      }),
    ]);

    // Check if property or investor does not exist
    if (!property || !investor) {
      return res.json({
        success: false,
        msg: "Invalid property or investor ID",
      });
    }

    // Check if investment amount is valid
    if (Number(amountInvested) <= 0) {
      return res.json({success: false, msg: "Invalid investment amount"});
    }

    // Check if investor has sufficient funds
    if (Number(amountInvested) > Number(investor.fundsAvailable)) {
      return res.json({
        success: false,
        msg: "Insufficient funds for investment",
      });
    }

    // Check if the property is already fully invested
    if (Number(property.tokenLeft) === 0) {
      return res.json({
        success: false,
        msg: "Property is already fully invested",
      });
    }

    let totalInvestedTokens = 0;

    // Calculate total invested tokens for unique investors
    if (Array.isArray(propertyInvestors) && propertyInvestors.length > 0) {
      // Filter out duplicate investors
      const uniqueInvestors = propertyInvestors.reduce((acc, pi) => {
        if (!acc.some((inv) => inv.id === pi.investor.id)) {
          acc.push(pi.investor);
        }
        return acc;
      }, []);

      // Calculate total invested tokens for unique investors
      totalInvestedTokens = uniqueInvestors.reduce((acc, investor) => {
        const investorPropertyInvestment = propertyInvestors.find(
          (pi) => pi.investor.id === investor.id
        );
        return (
          acc + (investorPropertyInvestment.property.myTokenOnProperty || 0)
        );
      }, 0);
    }

    console.log("Total Tokens on Property:", totalInvestedTokens);

    // Helper functions to calculate investment details
    function calculateTokenPrice(propertyValue, totalTokens) {
      return propertyValue / totalTokens;
    }

    function calculateInvestmentTokens(investmentAmount, tokenPrice) {
      return investmentAmount / tokenPrice; // Round down to ensure whole tokens
    }

    function calculateUserPercent(investmentTokens, totalTokens) {
      return (investmentTokens / totalTokens) * 100;
    }

    function calculateOwnedAmount(investmentTokens) {
      return investmentTokens; // Owned amount is directly represented by the number of tokens purchased
    }

    // Calculate investment details
    const tokenPrice = calculateTokenPrice(
      Number(property.totalAssetValueLeft),
      Number(property.tokenLeft)
    ); // Calculate token price
    console.log("This tokenprice 83", tokenPrice);

    const investmentTokens = calculateInvestmentTokens(
      Number(amountInvested),
      tokenPrice
    ); // Calculate tokens purchased
    console.log("THis is investmentTokens 88", investmentTokens);

    const userPercent = calculateUserPercent(
      investmentTokens,
      Number(property.totalToken)
    ); // Calculate user percentage ownership
    console.log("This is user percent 93", userPercent);

    // Use Prisma transaction to ensure atomic updates
    await prisma.$transaction(async (prisma) => {
      // Update property details
      await prisma.Property.update({
        where: {id: propertyId},
        data: {
          myTokenOnProperty: parseFloat(
            property.myTokenOnProperty + investmentTokens
          ),
          ageGrowth: property.ageGrowth + userPercent,
          tokenLeft: String(
            parseFloat(property.totalToken) -
              (totalInvestedTokens + investmentTokens)
          ),
          totalAssetValueLeft: String(
            Number(property.totalAssetValueLeft) - amountInvested
          ),
          amountInvestedByMe: parseFloat(
            property.amountInvestedByMe + String(userPercent)
          ),
        },
      });

      // Update investor details
      await prisma.Investor.update({
        where: {id: investorId},
        data: {
          fundsAvailable: String(
            Number(investor.fundsAvailable) - amountInvested
          ),
        },
      });

      // Create a new property investor record
      await prisma.PropertyInvestor.create({
        data: {
          propertyId: property.id,
          investorId: investor.id,
        },
      });
    });

    // Send success response
    res.json({
      success: true,
      msg: "Investment successful!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Investment failed"});
  }
});

// Export the investInProperty function
module.exports = {
  investInProperty,
};
