const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');

const dotenv = require('dotenv');
dotenv.config();
const argon = require('argon2');
const prisma = new PrismaClient();
const multer = require('multer');

const investInProperty = asyncHandler(async (req, res) => {
  try {
    const investorId = req.investor.id;
    const { propertyId, amountInvested } = req.body;
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
        msg: 'Missing property or investor ID or amountInvested',
      });
    }

    const [property, investor, propertyInvestors] = await Promise.all([
      prisma.Property.findUnique({
        where: { id: propertyId },
      }),
      prisma.Investor.findUnique({
        where: { id: investorId },
      }),
      prisma.PropertyInvestor.findMany({
        where: { propertyId: propertyId },
        include: { investor: true, property: true },
      }),
    ]);

    if (!property || !investor) {
      return res.json({
        success: false,
        msg: 'Invalid property or investor ID',
      });
    }

    if (Number(amountInvested) <= 0) {
      return res.json({ success: false, msg: 'Invalid investment amount' });
    }

    if (Number(amountInvested) > Number(investor.fundsAvailable)) {
      return res.json({
        success: false,
        msg: 'Insufficient funds for investment',
      });
    }

    if (Number(property.tokenLeft) === 0) {
      return res.json({
        success: false,
        msg: 'Property is already fully invested',
      });
    }

    let totalInvestedTokens = 0;

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

    console.log('Total Tokens on Property:', totalInvestedTokens);

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

    // User invests in the property with $50,000
    const tokenPrice = calculateTokenPrice(
      Number(property.totalAssetValueLeft),
      Number(property.tokenLeft)
    ); // Calculate token price
    console.log('This tokenprice 83', tokenPrice);
    const investmentTokens = calculateInvestmentTokens(
      Number(amountInvested),
      tokenPrice
    ); // Calculate tokens purchased
    console.log('THis is investmentTokens 88', investmentTokens);

    // Calculate investment details
    const userPercent = calculateUserPercent(
      investmentTokens,
      Number(property.totalToken)
    );
    console.log('This is user percent 93', userPercent);

    await prisma.$transaction(async (prisma) => {
      await prisma.Property.update({
        where: { id: propertyId },
        data: {
          myTokenOnProperty: parseFloat(
            property.myTokenOnProperty + investmentTokens
          ),
          ageGrowth: property.ageGrowth + userPercent,
          // Update total invested tokens on property
          tokenLeft: String(
            parseFloat(property.totalToken) -
              (totalInvestedTokens + investmentTokens)
          ),
          // Update tokenLeft based on total invested tokens
          totalAssetValueLeft: String(
            Number(property.totalAssetValueLeft) - amountInvested
          ),
          amountInvestedByMe: parseFloat(
            property.amountInvestedByMe + String(userPercent)
          ),
          // Increase invested amount for investor
        },
      });

      await prisma.Investor.update({
        where: { id: investorId },
        data: {
          fundsAvailable: String(
            Number(investor.fundsAvailable) - amountInvested
          ),
        },
      });

      await prisma.PropertyInvestor.create({
        data: {
          propertyId: property.id,
          investorId: investor.id,
        },
      });
    });

    res.json({
      success: true,
      msg: 'Investment successful!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Investment failed' });
  }
});

module.exports = {
  investInProperty,
};
