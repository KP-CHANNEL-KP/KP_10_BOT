/**
 * Cloudflare Worker for Telegram Group Help Bot (Auto-Reply & Moderation)
 * Requirements: Cloudflare Variables: BOT_TOKEN, BOT_SECRET
 */

// 1. Telegram API ကို ခေါ်ဆိုသော အခြေခံ Function
const TELEGRAM_API = (env) => `https://api.telegram.org/bot${env.BOT_TOKEN}`;

async function callTelegramApi(method, body, env) {
    return fetch(TELEGRAM_API(env) + '/' + method, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
}

// 2. အဖွဲ့ဝင်အသစ် ကြိုဆိုရေး (Welcome Message)
async function onNewChatMember(chatId, newMembers, env) {
    // Bot ကို Group ထဲ ထည့်သွင်းခြင်းသာ ဖြစ်ပါက Message မပို့စေရန်
    if (newMembers.some(member => member.is_bot && member.username === 'YOUR_BOT_USERNAME')) {
        return new Response('OK');
    }
    
    const memberNames = newMembers.map(member => member.first_name || 'အဖွဲ့ဝင်အသစ်').join(', ');
    
    const welcomeMessage = `Group ထဲကို ကြိုဆိုပါတယ်ရှင်၊ ${memberNames}! Group ရဲ့ စည်းကမ်းတွေကို ဖတ်ပေးဖို့ မေတ္တာရပ်ခံပါတယ်။`;

    // Welcome Message ပို့ခြင်း
    await callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: welcomeMessage,
    }, env);

    return new Response('OK');
}

// 3. Admin Command များကို ကိုင်တွယ်ခြင်း (Kick, Ban)
// မှတ်ချက်- Bot ကို Group Admin အဖြစ် ခန့်ထားမှသာ အလုပ်လုပ်မည်
async function onAdminCommand(message, env) {
    const chatId = message.chat.id;
    const text = message.text ? message.text.toLowerCase() : '';
    
    // Command ကို Reply လုပ်ထားမှသာ လုပ်ဆောင်မည်
    if (!message.reply_to_message) {
        return callTelegramApi('sendMessage', {
            chat_id: chatId,
            text: "ကန်ထုတ်/ပိတ်ဆို့ချင်သောသူ၏ စာကို Reply လုပ်ပြီး /kick (သို့မဟုတ်) /ban ကို ရိုက်ထည့်ပါ။"
        }, env);
    }
    
    const targetUserId = message.reply_to_message.from.id;
    const targetUserName = message.reply_to_message.from.first_name;

    let responseText = '';

    if (text.startsWith('/kick')) {
        // Kick (Temporary Restrict)
        await callTelegramApi('kickChatMember', {
            chat_id: chatId,
            user_id: targetUserId,
            until_date: Math.floor(Date.now() / 1000) + 60 // 1 မိနစ် ပိတ်ဆို့ပြီး ပြန်ဖွင့်
        }, env);
        responseText = `${targetUserName} ကို Group မှ ကန်ထုတ်လိုက်ပါသည်။`;
    } else if (text.startsWith('/ban')) {
        // Permanent Restrict (Ban)
        await callTelegramApi('kickChatMember', {
            chat_id: chatId,
            user_id: targetUserId,
        }, env);
        responseText = `${targetUserName} ကို Group မှ အပြီးတိုင် ပိတ်ဆို့လိုက်ပါသည်။`;
    }

    if (responseText) {
        return callTelegramApi('sendMessage', {
            chat_id: chatId,
            text: responseText,
        }, env);
    }
    
    return new Response('OK');
}


// 4. ပုံမှန် စာသား မက်ဆေ့ခ်ျများကို ကိုင်တွယ်ခြင်း (Auto-Reply & Command Keyboard)
async function onMessage(message, env) {
    const chatId = message.chat.id;
    const text = message.text ? message.text.toLowerCase() : '';
    let responseText = '';

    // >>> Auto Replay Logic (FAQ) <<<
    if (text.includes('/start')) {
        responseText = "မင်္ဂလာပါရှင်! ကျွန်မကတော့ အလိုအလျောက် ပြန်ဖြေပေးတဲ့ Bot ဖြစ်ပါတယ်။ Group ရဲ့ စည်းကမ်းတွေကို ထိန်းသိမ်းပေးခြင်း၊ အမေးအဖြေများကို ပြန်လည်ဖြေကြားပေးခြင်းတို့ လုပ်ဆောင်ပေးပါတယ်။";
    } else if (text.includes('ဈေးနှုန်း') || text.includes('price')) {
        responseText = "လက်ရှိ ဝန်ဆောင်မှု ဈေးနှုန်းများမှာ ၁၀၀၀ ကျပ် မှ ၅၀၀၀ ကျပ် အတွင်းရှိပါသည်။ အသေးစိတ်ကို Private Chat တွင် မေးမြန်းနိုင်ပါသည်။";
    } else if (text.includes('လိပ်စာ') || text.includes('address')) {
        responseText = "ကျွန်တော်တို့ရဲ့ ရုံးလိပ်စာကတော့ ရန်ကုန်မြို့၊ ကမာရွတ်မြို့နယ်မှာ တည်ရှိပါတယ်။ ဆက်သွယ်ရန်ဖုန်းနံပါတ်: example@email.com";
    } else if (text.includes('နေကောင်းလား')) {
        responseText = "ကျေးဇူးတင်ပါတယ်၊ ကျွန်မ ကောင်းပါတယ်။ သင်ရော နေကောင်းလားရှင်။";
    } else {
        // Default message
        responseText = "ကျွန်တော် နားမလည်သေးပါဘူး။ ကျေးဇူးပြုပြီး အောက်က ခလုတ်များကို အသုံးပြုပြီး မေးမြန်းပေးပါ (သို့မဟုတ်) /start ကို ပို့ပါ။";
    }
    // >>> Auto Replay Logic ပြီးဆုံးခြင်း <<<

    // Reply Keyboard ကို သတ်မှတ်ခြင်း
    const replyMarkup = {
        keyboard: [
            [{ text: '/start' }, { text: 'ဈေးနှုန်း' }],
            [{ text: 'လိပ်စာ' }, { text: 'နေကောင်းလား' }]
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


// 5. Worker ရဲ့ အဓိက fetch Listener
export default {
    async fetch(request, env) {
        // Webhook Secret Token စစ်ဆေးခြင်း
        const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
        if (secret !== env.BOT_SECRET) {
            return new Response("Unauthorized", { status: 401 }); 
        }

        // GET Request အတွက် စာသားပြန်ပေးခြင်း (Worker URL ကို Browser တွင် စမ်းသပ်သည့်အခါ)
        if (request.method !== 'POST') {
             return new Response('Hello from Telegram Bot Worker', { status: 200 });
        }


        try {
            const update = await request.json();

            if (update.message) {
                // Group ထဲကို Member အသစ် ဝင်လာလျှင်
                if (update.message.new_chat_members) {
                    const chatId = update.message.chat.id;
                    const newMembers = update.message.new_chat_members;
                    return onNewChatMember(chatId, newMembers, env);
                } 
                // ပုံမှန် Message သို့မဟုတ် Command ရောက်လာလျှင်
                else if (update.message.text) {
                    const text = update.message.text.toLowerCase();
                    
                    // Admin Command (Kick/Ban) ကို အရင်စစ်ဆေးပါ
                    if (text.startsWith('/kick') || text.startsWith('/ban')) {
                        return onAdminCommand(update.message, env);
                    }
                    
                    // ပုံမှန် Message ကို ကိုင်တွယ်ပါ
                    return onMessage(update.message, env);
                }
            }
            
            return new Response('OK');
        } catch (e) {
            return new Response('Bad Request', { status: 400 });
        }
    },
};
