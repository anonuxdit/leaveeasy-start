// ─────────────────────────────────────────────────────────────
// js/ai-test.js — หน้าทดสอบเรียก OpenRouter AI (ไม่ผูกกับเมนูหลัก)
// คีย์ผู้ใช้กรอกเองในหน้าเว็บ เก็บแค่ใน localStorage ของเบราว์เซอร์
// ห้ามฝังคีย์จริงไว้ในไฟล์นี้เด็ดขาด (ดูหัวข้อ Security ใน CLAUDE.md)
// ─────────────────────────────────────────────────────────────
(function () {
  var ช่องคีย์ = document.getElementById("apiKey");
  var ปุ่มทดสอบ = document.getElementById("ปุ่มทดสอบ");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var กล่องผลลัพธ์ = document.getElementById("ผลลัพธ์");
  var กล่องคำตอบ = document.getElementById("คำตอบ");

  var คีย์ที่เคยบันทึก = window.OPENROUTER_API_KEY || localStorage.getItem("openrouterApiKey");
  if (คีย์ที่เคยบันทึก) ช่องคีย์.value = คีย์ที่เคยบันทึก;

  ปุ่มทดสอบ.addEventListener("click", async function () {
    var คีย์ = ช่องคีย์.value.trim();
    if (!คีย์) {
      เตือน("กรอก API Key ก่อน จึงจะทดสอบได้");
      return;
    }
    กล่องเตือน.classList.add("hidden");
    กล่องผลลัพธ์.classList.add("hidden");

    localStorage.setItem("openrouterApiKey", คีย์);

    ปุ่มทดสอบ.disabled = true;
    ปุ่มทดสอบ.textContent = "กำลังส่ง...";
    try {
      var ผลลัพธ์ = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + คีย์,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: "สวัสดี" }]
        })
      });

      var ข้อมูล = await ผลลัพธ์.json();

      if (!ผลลัพธ์.ok) {
        var ข้อความผิดพลาด = (ข้อมูล.error && ข้อมูล.error.message) || ผลลัพธ์.status;
        throw new Error(ข้อความผิดพลาด);
      }

      var คำตอบ = ข้อมูล.choices && ข้อมูล.choices[0] && ข้อมูล.choices[0].message
        ? ข้อมูล.choices[0].message.content
        : "(ไม่มีคำตอบกลับมา)";

      กล่องคำตอบ.textContent = คำตอบ;
      กล่องผลลัพธ์.classList.remove("hidden");
    } catch (err) {
      เตือน("เรียก OpenRouter ไม่สำเร็จ: " + err.message);
    } finally {
      ปุ่มทดสอบ.disabled = false;
      ปุ่มทดสอบ.textContent = 'ส่งข้อความ "สวัสดี"';
    }
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
})();
