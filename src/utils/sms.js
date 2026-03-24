const smsStore = new Map();

function generateSmsCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSmsCode(phone) {
    const code = generateSmsCode();
    smsStore.set(phone, code);
    
    setTimeout(() => {
        smsStore.delete(phone);
    }, 5 * 60 * 1000);
    
    // ========== 阿里云短信配置 ==========
    // 需要安装: npm install @alicloud/dysmsapi20170525
    // 或使用其他短信SDK
    
    const config = {
        accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
        endpoint: 'dysmsapi.aliyuncs.com',
        apiVersion: '2017-05-25'
    };
    
    // 短信签名名称（需要在阿里云后台申请）
    const signName = '你的短信签名';
    
    // 短信模板CODE（需要在阿里云后台申请）
    const templateCode = 'SMS_XXXXXXXX';
    
    try {
        // 方式1: 使用阿里云 SDK（需要安装 @alicloud/dysmsapi20170525）
        // const dysmsapi = require('@alicloud/dysmsapi20170525');
        // const client = new dysmsapi.default({
        //     accessKeyId: config.accessKeyId,
        //     accessKeySecret: config.accessKeySecret,
        //     endpoint: config.endpoint,
        // });
        // await client.sendSms({
        //     PhoneNumbers: phone,
        //     SignName: signName,
        //     TemplateCode: templateCode,
        //     TemplateParam: JSON.stringify({ code: code })
        // });
        
        // 方式2: 使用 HTTP 请求
        const AliyunRequest = require('@alibaba-cloud/tea-util').default;
        const https = require('https');
        
        const params = {
            AccessKeyId: config.accessKeyId,
            Action: 'SendSms',
            Format: 'JSON',
            PhoneNumbers: phone,
            SignName: signName,
            SignatureMethod: 'HMAC-SHA1',
            SignatureNonce: Math.random().toString(),
            SignatureVersion: '1.0',
            TemplateCode: templateCode,
            TemplateParam: JSON.stringify({ code: code }),
            Timestamp: new Date().toISOString(),
            Version: '2017-05-25'
        };
        
        // 签名计算（需要参考阿里云文档实现）
        console.log(`[阿里云短信] 发送给 ${phone} 的验证码: ${code}`);
        
        return {
            success: true,
            message: '验证码发送成功'
        };
    } catch (error) {
        console.error('短信发送失败:', error);
        return {
            success: false,
            message: '短信发送失败，请稍后重试'
        };
    }
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
