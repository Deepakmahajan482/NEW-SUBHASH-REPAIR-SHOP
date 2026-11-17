import Setting from '../models/Setting.js';
import { sendWhatsAppCloudMessage } from '../utils/whatsapp.js';

export const getSettings = async (req, res, next) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({
        ownerPhotoUrl: '/owner.png',
        qrCodeUrl: '/qr-code.png',
      });
    } else {
      let needsSave = false;
      if (!setting.ownerPhotoUrl) {
        setting.ownerPhotoUrl = '/owner.png';
        needsSave = true;
      }
      if (!setting.qrCodeUrl) {
        setting.qrCodeUrl = '/qr-code.png';
        needsSave = true;
      }
      if (needsSave) {
        await setting.save();
      }
    }
    res.status(200).json(setting);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting();
    }

    const {
      headerBanner,
      shopName,
      shopNo,
      mobile,
      specifications,
      propertyOwner,
      ownerPhotoUrl,
      qrCodeUrl,
      upiId,
      whatsappAccessToken,
      whatsappPhoneId,
      whatsappAutoSend,
      whatsappMessageTemplate,
    } = req.body;

    if (headerBanner !== undefined) setting.headerBanner = headerBanner;
    if (shopName !== undefined) setting.shopName = shopName;
    if (shopNo !== undefined) setting.shopNo = shopNo;
    if (mobile !== undefined) setting.mobile = mobile;
    if (specifications !== undefined) setting.specifications = specifications;
    if (propertyOwner !== undefined) setting.propertyOwner = propertyOwner;
    if (ownerPhotoUrl !== undefined) setting.ownerPhotoUrl = ownerPhotoUrl;
    if (qrCodeUrl !== undefined) setting.qrCodeUrl = qrCodeUrl;
    if (upiId !== undefined) setting.upiId = upiId;
    if (whatsappAccessToken !== undefined) setting.whatsappAccessToken = whatsappAccessToken;
    if (whatsappPhoneId !== undefined) setting.whatsappPhoneId = whatsappPhoneId;
    if (whatsappAutoSend !== undefined) setting.whatsappAutoSend = whatsappAutoSend;
    if (whatsappMessageTemplate !== undefined) setting.whatsappMessageTemplate = whatsappMessageTemplate;

    const saved = await setting.save();
    res.status(200).json(saved);
  } catch (error) {
    next(error);
  }
};

export const testWhatsApp = async (req, res, next) => {
  try {
    const { testPhone, accessToken, phoneId } = req.body;

    const setting = await Setting.findOne();
    const token = accessToken || setting?.whatsappAccessToken;
    const pId = phoneId || setting?.whatsappPhoneId;

    if (!token || !pId) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp Access Token and Phone ID must be provided or saved in Settings first.',
      });
    }

    if (!testPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a test mobile phone number.',
      });
    }

    const testMessage = `👋 Sat Sri Akal / Hello!\nThis is a test notification from *${setting?.shopName || 'New Subash Repair Shop'}*.\n\nYour WhatsApp Cloud API automation is successfully configured and active! ✅`;

    const result = await sendWhatsAppCloudMessage({
      phoneId: pId,
      accessToken: token,
      toPhone: testPhone,
      messageText: testMessage,
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'WhatsApp test message sent successfully!',
        messageId: result.messageId,
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Failed to send test message: ${result.error}`,
      });
    }
  } catch (error) {
    next(error);
  }
};
