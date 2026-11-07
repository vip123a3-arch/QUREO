const express = require('express');
const axios = require('axios');
const { chromium } = require('playwright');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Qureo AI Solver</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
            body { background-color: #eef2f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
            .container { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); width: 100%; max-width: 450px; }
            h1 { text-align: center; color: #6c5ce7; margin-bottom: 5px; font-weight: 900; }
            .subtitle { text-align: center; color: #636e72; margin-bottom: 30px; font-size: 15px; }
            .input-group { margin-bottom: 20px; }
            .input-group label { display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px; color: #636e72; }
            input { width: 100%; padding: 14px; border: 2px solid #dfe6e9; border-radius: 12px; font-size: 15px; outline: none; background: #f8f9fa; transition: 0.3s; }
            input:focus { border-color: #6c5ce7; background: #fff; }
            button { width: 100%; padding: 16px; background: #6c5ce7; color: white; border: none; border-radius: 12px; font-size: 18px; font-weight: bold; cursor: pointer; transition: 0.3s; }
            button:hover { background: #5a4bcf; }
            button:disabled { background: #a29bfe; cursor: not-allowed; }
            #result { margin-top: 20px; padding: 15px; border-radius: 12px; text-align: center; font-weight: bold; display: none; }
            .success { background: #d4edda; color: #155724; }
            .error { background: #f8d7da; color: #721c24; }
            .code-box { background: #2d3436; color: #00b894; padding: 15px; border-radius: 8px; text-align: left; direction: ltr; font-family: monospace; margin-top: 10px; overflow-x: auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Qureo Solver</h1>
            <p class="subtitle">المنصة الحقيقية للحل الذكي</p>
            <form id="solveForm">
                <div class="input-group">
                    <label>رقم الطالب (ID)</label>
                    <input type="text" id="student_id" placeholder="أدخل الـ ID" required>
                </div>
                <div class="input-group">
                    <label>كلمة المرور</label>
                    <input type="password" id="password" placeholder="أدخل كلمة المرور" required>
                </div>
                <button type="submit" id="submitBtn">تسجيل الدخول وبدء الحل</button>
            </form>
            <div id="result"></div>
        </div>
        <script>
            document.getElementById('solveForm').onsubmit = async (e) => {
                e.preventDefault();
                const btn = document.getElementById('submitBtn');
                const resDiv = document.getElementById('result');
                btn.innerText = "جاري الحل الآن...";
                btn.disabled = true;
                resDiv.style.display = 'none';

                try {
                    const response = await fetch('/api/solve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            student_id: document.getElementById('student_id').value,
                            password: document.getElementById('password').value
                        })
                    });
                    const data = await response.json();
                    resDiv.style.display = 'block';
                    if(data.status === 'success') {
                        resDiv.className = 'success';
                        resDiv.innerHTML = data.message;
                    } else {
                        resDiv.className = 'error';
                        resDiv.innerHTML = data.message;
                    }
                } catch (err) {
                    resDiv.style.display = 'block';
                    resDiv.className = 'error';
                    resDiv.innerText = "حدث خطأ في الاتصال.";
                }
                btn.innerText = "تسجيل الدخول وبدء الحل";
                btn.disabled = false;
            };
        </script>
    </body>
    </html>
    `);
});

app.post('/api/solve', async (req, res) => {
    const { student_id, password } = req.body;
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto('https://me-tp.qureo.education/');
        await page.fill('input[name="student_id"]', student_id);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(5000); 

        const questionText = await page.innerText('body');

        const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama3-8b-8192",
            messages: [
                { role: "system", content: "أنت مبرمج خبير في JavaScript. اقرأ السؤال واكتب الكود الصح فقط." },
                { role: "user", content: questionText }
            ]
        }, {
            headers: {
                'Authorization': `Bearer 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`,
                'Content-Type': 'application/json'
            }
        });

        const codeToSolve = groqResponse.data.choices[0].message.content;
        await browser.close();

        res.json({ 
            status: "success", 
            message: `✅ تم الدخول للمنصة بنجاح!<br>🤖 الحل الجاهز:<div class="code-box">${codeToSolve}</div>` 
        });

    } catch (error) {
        if(browser) await browser.close();
        res.json({ 
            status: "error", 
            message: "❌ تأكد من رقم الطالب وكلمة المرور، أو أن المنصة لم ترد." 
        });
    }
});

module.exports = app;
