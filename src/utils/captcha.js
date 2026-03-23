const svgCaptcha = require('svg-captcha');
const captchaStore = new Map();

function generateCaptcha() {
    const captcha = svgCaptcha.create({
        width: 120,
        height: 40,
        fontSize: 48,
        background: '#f5f5f5',
        charPreset: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    });
    
    const token = Date.now().toString(36) + Math.random().toString(36).substr(2);
    captchaStore.set(token, captcha.text.toLowerCase());
    
    setTimeout(() => {
        captchaStore.delete(token);
    }, 5 * 60 * 1000);
    
    return {
        token,
        data: captcha.data
    };
}

function validateCaptcha(token, userInput) {
    if (!token || !userInput) {
        return false;
    }
    
    const expected = captchaStore.get(token);
    if (!expected) {
        return false;
    }
    
    const isValid = expected === userInput.toLowerCase().trim();
    captchaStore.delete(token);
    
    return isValid;
}

module.exports = {
    generateCaptcha,
    validateCaptcha
};