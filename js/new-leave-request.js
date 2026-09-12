// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7: บันทึกใบลาใหม่ลง Firestore จริง
// ─────────────────────────────────────────────────────────────
import { db } from "./firebase-init.js";
import { requireLogin } from "./auth-guard.js";
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

(async function () {
  var ผู้ล็อกอิน = await requireLogin();

  var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
  var ช่องประเภท = document.getElementById("leaveTypeId");
  var ช่องเหตุผล = document.getElementById("reason");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");
  var ปุ่มAI = document.getElementById("ปุ่มAI");
  var ป้ายAI = document.getElementById("ป้ายAI");
  var คำเตือนAI = document.getElementById("คำเตือนAI");

  var ประเภททั้งหมด = [];
  try {
    var สแนปช็อต = await getDocs(collection(db, "leaveTypes"));
    ประเภททั้งหมด = สแนปช็อต.docs.map(function (d) {
      return Object.assign({ id: d.id }, d.data());
    });
  } catch (err) {
    เตือน("โหลดประเภทการลาจาก Firestore ไม่สำเร็จ: " + err.message);
    return;
  }

  // เติมรายการเลื่อนลงด้วยประเภทการลาที่มีอยู่
  ประเภททั้งหมด.forEach(function (ประเภท) {
    var ตัวเลือก = document.createElement("option");
    ตัวเลือก.value = ประเภท.id;
    ตัวเลือก.textContent = ประเภท.name;
    ช่องประเภท.appendChild(ตัวเลือก);
  });

  ฟอร์ม.addEventListener("submit", async function (e) {
    e.preventDefault();

    var ค่า = {
      title: document.getElementById("title").value.trim(),
      reason: document.getElementById("reason").value.trim(),
      leaveTypeId: ช่องประเภท.value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value
    };

    // ตรวจว่ากรอกครบก่อนบันทึก
    if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
      เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
      return;
    }
    if (ค่า.endDate < ค่า.startDate) {
      เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
      return;
    }

    var ประเภท = ประเภททั้งหมด.find(function (t) { return t.id === ค่า.leaveTypeId; });

    var ใบใหม่ = {
      title: ค่า.title,
      reason: ค่า.reason,
      status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
      requesterId: ผู้ล็อกอิน.uid, requesterName: ผู้ล็อกอิน.name,
      approverId: "",      approverName: "",
      leaveTypeId: ประเภท.id, leaveTypeName: ประเภท.name,
      startDate: ค่า.startDate,
      endDate: ค่า.endDate,
      createdAt: เวลาตอนนี้()
    };

    ปุ่มบันทึก.disabled = true;
    try {
      await addDoc(collection(db, "leaveRequests"), ใบใหม่);
      location.href = "leave-requests.html";
    } catch (err) {
      เตือน("บันทึกลง Firestore ไม่สำเร็จ: " + err.message);
      ปุ่มบันทึก.disabled = false;
    }
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }

  ปุ่มAI.addEventListener("click", async function () {
    ป้ายAI.classList.add("hidden");
    คำเตือนAI.classList.add("hidden");

    var เหตุผล = ช่องเหตุผล.value.trim();
    if (!เหตุผล) {
      เตือนAI("กรอกเหตุผลการลาก่อน จึงให้ AI ช่วยจัดประเภทได้");
      return;
    }

    var คีย์ = window.OPENROUTER_API_KEY || localStorage.getItem("openrouterApiKey");
    if (!คีย์) {
      เตือนAI("ยังไม่ได้ตั้งค่า OpenRouter API Key — ใส่ในไฟล์ js/ai-config.local.js (เครื่องนี้เท่านั้น) หรือกรอกที่หน้า ai-test.html ก่อน");
      return;
    }

    ปุ่มAI.disabled = true;
    ปุ่มAI.textContent = "กำลังจัดประเภท...";

    var ตัวควบคุม = new AbortController();
    var หมดเวลา = setTimeout(function () { ตัวควบคุม.abort(); }, 15000);

    try {
      var รายชื่อประเภท = ประเภททั้งหมด.map(function (t) {
        return { id: t.id, name: t.name };
      });

      var ผลลัพธ์ = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: ตัวควบคุม.signal,
        headers: {
          "Authorization": "Bearer " + คีย์,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: "คุณคือผู้ช่วยจัดประเภทการลา ตอบกลับเป็น JSON เท่านั้น รูปแบบ {\"leaveTypeId\": \"<id ที่ให้ไปเท่านั้น>\"} หรือ {\"leaveTypeId\": null} ถ้าไม่มีประเภทไหนตรง ห้ามตอบอย่างอื่นนอกเหนือจาก JSON นี้"
            },
            {
              role: "user",
              content: "เหตุผลการลา: " + เหตุผล + "\n\nประเภทการลาที่มีอยู่จริง: " + JSON.stringify(รายชื่อประเภท)
            }
          ]
        })
      });

      var ข้อมูล = await ผลลัพธ์.json();
      if (!ผลลัพธ์.ok) {
        throw new Error((ข้อมูล.error && ข้อมูล.error.message) || String(ผลลัพธ์.status));
      }

      var เนื้อหา = ข้อมูล.choices && ข้อมูล.choices[0] && ข้อมูล.choices[0].message
        ? ข้อมูล.choices[0].message.content
        : "";
      เนื้อหา = เนื้อหา.replace(/```json|```/g, "").trim();

      var แยกวิเคราะห์;
      try {
        แยกวิเคราะห์ = JSON.parse(เนื้อหา);
      } catch (parseErr) {
        แยกวิเคราะห์ = null;
      }

      var ประเภทที่ตรง = แยกวิเคราะห์ && แยกวิเคราะห์.leaveTypeId
        ? ประเภททั้งหมด.find(function (t) { return t.id === แยกวิเคราะห์.leaveTypeId; })
        : null;

      if (ประเภทที่ตรง) {
        ช่องประเภท.value = ประเภทที่ตรง.id;
        ป้ายAI.classList.remove("hidden");
      } else {
        เตือนAI("จัดประเภทให้ไม่ได้ — โปรดเลือกประเภทการลาเอง");
      }
    } catch (err) {
      var ข้อความ = err.name === "AbortError"
        ? "เรียก AI ไม่สำเร็จ: ใช้เวลานานเกิน 15 วินาที"
        : "เรียก AI ไม่สำเร็จ: " + err.message;
      เตือนAI(ข้อความ);
    } finally {
      clearTimeout(หมดเวลา);
      ปุ่มAI.disabled = false;
      ปุ่มAI.textContent = "ให้ AI ช่วยจัดประเภทการลา";
    }
  });

  function เตือนAI(ข้อความ) {
    คำเตือนAI.textContent = "⚠️ " + ข้อความ;
    คำเตือนAI.classList.remove("hidden");
  }
})();
