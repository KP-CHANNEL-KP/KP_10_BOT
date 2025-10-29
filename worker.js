// 4. ပုံမှန် စာသား မက်ဆေ့ခ်ျများကို ကိုင်တွယ်ခြင်း (Auto-Reply & Command Keyboard)
async function onMessage(message, env) {
    const chatId = message.chat.id;
    const text = message.text ? message.text.toLowerCase() : '';
    let responseText = '';

    // >>> Auto Replay Logic (FAQ) <<<

    if (text.includes('/start')) {
        responseText = "မင်္ဂလာပါ။ ကျနော်က မေးတာတွေ အလိုလျှောက် စာပြန်ပေးတဲ့ bot ပါ KP ဆီမှာ ဘယ် Service များ လိုချင်လို့လဲ ခမျ";
    } else if (text.includes('/mytel cf စျေးနှုန်း') || text.includes('mytel cf price')) {
        responseText = "လက်ရှိ မှာတော့ ၁လစာ (၅၀၀၀)၊ ၁၅ရက်စာ (၃၀၀၀) နဲ့ ရပါတယ်​ဗျ။ အသေးစိတ်ကို Private Chat တွင် မေးမြန်းနိုင်ပါတယ်။";
    } else if (text.includes('/mytel gcp စျေးနှုန်း') || text.includes('mytel gcp address')) {
        // မှတ်ချက်: Command ကို lowercase ပြောင်းပြီး စစ်ဆေးရန် '/mytel gcp စျေးနှုန်း' သို့ ပြောင်းထားသည်။
        responseText = "လက်ရှိ မှာတော့ ၁လစာ (၅၀၀၀) ကိုမှ KP VPN PRO APK နဲ့ပဲ ရပါအုံးမယ်ခမျ";
    } else if (text.includes('/all sim all wifi စျေးနှုန်း')) {
        responseText = "၁လစာ ၁၀၀gb ကိုမှ (၃၀၀၀) ကနေစရပါတယ်။ နောက်ပီး ကိုယ်လိုချင်တဲ့ ရက်၊ gb ကိုလဲ custom အနေနဲ့ ဝယ်သုံးလို့ရပါတယ်";
    } else {
        // Default message
        responseText = "ကျွန်တော် နားမလည်သေးပါဘူး။ ကျေးဇူးပြုပြီး အောက်က ခလုတ်များကို အသုံးပြုပြီး မေးမြန်းပေးပါ (သို့မဟုတ်) /start ကို ပို့ပါ။";
    }
    // >>> Auto Replay Logic ပြီးဆုံးခြင်း <<<

    // Reply Keyboard ကို သတ်မှတ်ခြင်း
    const replyMarkup = {
        keyboard: [
            [{ text: '/start' }, { text: '/Mytel Cf စျေးနှုန်း' }],
            [{ text: '/Mytel Gcp စျေးနှုန်း' }, { text: '/All Sim All Wifi စျေးနှုန်း' }]
        ],
        resize_keyboard: true, 
        one_time_keyboard: false 
    };
    
    await callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: responseText,
        reply_markup: replyMarkup 
    }, env);
    
    return new Response('OK');
}
