const axios = require('axios');

const MOOLRE_BASE_URL = process.env.MOOLRE_BASE_URL || 'https://api.moolre.com/v1';
const MOOLRE_API_KEY = process.env.MOOLRE_API_KEY;

const moolreClient = axios.create({
  baseURL: MOOLRE_BASE_URL,
  headers: {
    'Authorization': `Bearer ${MOOLRE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Initiate a mobile money payment collection
 */
const initiatePayment = async ({ amount, phone, network, reference, orderNumber, description }) => {
  try {
    // Normalize network name for Moolre
    const networkMap = {
      'MTN': 'MTN',
      'AIRTELTIGO': 'AIRTELTIGO',
      'TELECEL': 'TELECEL',
      'VODAFONE': 'TELECEL',
    };
    const normalizedNetwork = networkMap[network.toUpperCase()] || network.toUpperCase();

    const payload = {
      amount: parseFloat(amount).toFixed(2),
      phone_number: phone,
      network: normalizedNetwork,
      reference: reference,
      description: description || `NetGH Order ${orderNumber}`,
      callback_url: process.env.MOOLRE_CALLBACK_URL,
    };

    console.log(`[Moolre] Initiating payment for order ${orderNumber}:`, { amount, phone, network: normalizedNetwork });

    const response = await moolreClient.post('/collection', payload);
    const data = response.data;

    return {
      success: true,
      reference: data.reference || data.transaction_id || reference,
      message: data.message || 'Payment prompt sent to your phone. Please approve.',
      raw: data,
    };
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || 'Payment initiation failed';
    console.error('[Moolre] Payment initiation error:', errorMessage, err.response?.data);
    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * Deliver data bundle via Moolre
 */
const deliverData = async ({ network, phone, size, orderId, orderNumber }) => {
  try {
    const networkMap = {
      'mtn': 'MTN',
      'airteltigo': 'AIRTELTIGO',
      'telecel': 'TELECEL',
    };
    const normalizedNetwork = networkMap[network.toLowerCase()] || network.toUpperCase();

    // Parse size (e.g., "1GB", "500MB")
    const sizeMatch = size.match(/^(\d+(?:\.\d+)?)\s*(GB|MB)/i);
    const sizeInMB = sizeMatch
      ? sizeMatch[2].toUpperCase() === 'GB'
        ? parseFloat(sizeMatch[1]) * 1024
        : parseFloat(sizeMatch[1])
      : 0;

    const payload = {
      network: normalizedNetwork,
      phone_number: phone,
      data_mb: sizeInMB,
      reference: orderId,
      description: `NetGH Data Delivery - ${orderNumber}`,
    };

    console.log(`[Moolre] Delivering data for order ${orderNumber}:`, { network: normalizedNetwork, phone, size });

    const response = await moolreClient.post('/data-bundle', payload);
    const data = response.data;

    return {
      success: true,
      reference: data.reference || data.transaction_id,
      message: data.message || 'Data delivered successfully',
      raw: data,
    };
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || 'Data delivery failed';
    console.error('[Moolre] Data delivery error:', errorMessage, err.response?.data);
    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * Check payment/delivery status
 */
const checkStatus = async (reference) => {
  try {
    const response = await moolreClient.get(`/transaction/${reference}`);
    return { success: true, data: response.data };
  } catch (err) {
    console.error('[Moolre] Status check error:', err.response?.data);
    return { success: false, message: err.response?.data?.message || 'Status check failed' };
  }
};

module.exports = { initiatePayment, deliverData, checkStatus };
