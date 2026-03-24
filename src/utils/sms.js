const smsStore = new Map();

function generateSmsCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function sendSmsCode(phone) {
    const code = generateSmsCode();
    smsStore.set(phone, code);
    
    setTimeout(() => {
        smsStore.delete(phone);
    }, 5 * 60 * 1000);
    
    console.log(`[短信验证码] 发送给 ${phone} 的验证码: ${code}`);
    
    return {
        success: true,
        message: '验证码发送成功',
        code: code
    };
}

function verifySmsCode(phone, userInput) {
    if (!phone || !userInput) {
        return false;
    }
    
    const storedCode = smsStore.get(phone);
    if (!storedCode) {
        return false;
    }
    
    const isValid = storedCode === userInput.trim();
    if (isValid) {
        smsStore.delete(phone);
    }
    
    return isValid;
}

module.exports = {
    sendSmsCode,
    verifySmsCode
};
