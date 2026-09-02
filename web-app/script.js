// API এন্ডপয়েন্ট
const API_URL = 'http://localhost:3000/api/v1';
const API_KEY = 'your-api-key-here';

// ন্যাভিগেশন ফাংশন
function goToGenerator() {
    document.getElementById('generator').style.display = 'block';
    document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
}

function goToOptimizer() {
    alert('অপটিমাইজার শীঘ্রই আসছে!');
}

function goToDebugger() {
    alert('ডিবাগার শীঘ্রই আসছে!');
}

// কোড জেনারেট করুন
async function generateCode() {
    const prompt = document.getElementById('prompt').value;
    const language = document.getElementById('language').value;

    if (!prompt.trim()) {
        alert('অনুগ্রহ করে আপনার অনুরোধ বর্ণনা করুন!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/generate-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({ prompt, language })
        });

        if (!response.ok) {
            throw new Error('API অনুরোধ ব্যর্থ');
        }

        const data = await response.json();
        displayCode(data.code);
    } catch (error) {
        alert('ত্রুটি: ' + error.message);
        console.error(error);
    }
}

// কোড প্রদর্শন করুন
function displayCode(code) {
    document.getElementById('codeOutput').textContent = code;
    document.getElementById('result').style.display = 'block';
}

// কোড কপি করুন
function copyCode() {
    const codeOutput = document.getElementById('codeOutput').textContent;
    navigator.clipboard.writeText(codeOutput).then(() => {
        alert('কোড ক্লিপবোর্ডে কপি করা হয়েছে!');
    }).catch(() => {
        alert('কপি করতে ব্যর্থ!');
    });
}

// পরিকল্পনা নির্বাচন করুন
function selectPlan(plan) {
    alert(`আপনি ${plan} পরিকল্পনা নির্বাচন করেছেন!`);
    // Stripe ইন্টিগ্রেশন এখানে হবে
}

// পৃষ্ঠা লোড হলে
document.addEventListener('DOMContentLoaded', () => {
    console.log('Qwen Code Generator লোড হয়েছে!');
});
