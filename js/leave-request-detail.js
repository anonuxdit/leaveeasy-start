// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: อ่านใบลาและความเห็นจริงจาก Firestore
// กดอนุมัติ/ไม่อนุมัติ แก้เฉพาะช่อง status กลับลง Firestore จริง (updateDoc)
// เขียนความเห็นยังเปลี่ยนแค่ในหน่วยความจำ (ของงานรอบถัดไป)
// ─────────────────────────────────────────────────────────────
import { db } from "./firebase-init.js";
import { requireLogin } from "./auth-guard.js";
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

(async function () {
  var ผู้ล็อกอิน = await requireLogin();

  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");

  // ไม่มี id ต่อท้าย URL (เช่น เปิดหน้านี้ตรง ๆ โดยไม่ได้กดจากหน้ารายการ) — ไม่ต้องลอง query Firestore
  if (!รหัสใบลา) {
    กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
    return;
  }

  var ใบ, ความเห็น;
  try {
    var เอกสารใบลา = await getDoc(doc(db, "leaveRequests", รหัสใบลา));
    if (เอกสารใบลา.exists()) {
      ใบ = Object.assign({ id: เอกสารใบลา.id }, เอกสารใบลา.data());
      var สแนปช็อตความเห็น = await getDocs(collection(db, "leaveRequests", รหัสใบลา, "approvals"));
      ความเห็น = สแนปช็อตความเห็น.docs.map(function (d) {
        return Object.assign({ id: d.id }, d.data());
      });
    }
  } catch (err) {
    กล่องใบลา.innerHTML = "<p>⚠️ โหลดข้อมูลจาก Firestore ไม่สำเร็จ: " + esc(err.message) + "</p>";
    return;
  }

  // ตาม ACL.md — พนักงานเปิดดูใบลาของคนอื่นไม่ได้ ตอบเหมือน "ไม่พบใบลา" เพื่อไม่ยืนยันว่ามีใบนี้อยู่จริง
  var ไม่พบหรือไม่มีสิทธิ์ = !ใบ || (ผู้ล็อกอิน.role === "employee" && ใบ.requesterId !== ผู้ล็อกอิน.uid);
  if (ไม่พบหรือไม่มีสิทธิ์) {
    กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
    return;
  }

  วาดใบลา();
  วาดความเห็น();
  กล่องความเห็น.classList.remove("hidden");

  document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);

  // ── วาดข้อมูลใบลาลงหน้าจอ ──
  function วาดใบลา() {
    var แถว = [
      ["หัวข้อ", esc(ใบ.title)],
      ["เหตุผลการลา", esc(ใบ.reason)],
      ["ประเภทการลา", esc(ใบ.leaveTypeName)],
      ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
      ["ผู้ขอลา", esc(ใบ.requesterName)],
      ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
      ["สถานะ", ป้ายสถานะ(ใบ.status)],
      ["วันที่ยื่น", esc(ใบ.createdAt)]
    ];

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");

    // ตาม ACL.md — อนุมัติ/ไม่อนุมัติ เฉพาะหัวหน้ากับฝ่ายบุคคล · ลบได้เฉพาะเจ้าของใบ หรือฝ่ายบุคคล
    var เป็นเจ้าของใบ = ใบ.requesterId === ผู้ล็อกอิน.uid;
    var แสดงปุ่มอนุมัติ = ผู้ล็อกอิน.role === "manager" || ผู้ล็อกอิน.role === "hr";
    var แสดงปุ่มลบ = เป็นเจ้าของใบ || ผู้ล็อกอิน.role === "hr";

    // สรุปใบลาโดย AI — ให้ผู้อนุมัติอ่านก่อนตัดสินใจ (สัปดาห์ที่ 8)
    if (ใบ.aiSuggestion) {
      html +=
        '<div class="alert alert-ai">สรุปโดย AI — โปรดตรวจสอบก่อนตัดสินใจ<br>' + esc(ใบ.aiSuggestion) +
        '<div class="hint">สรุปเมื่อ ' + esc(ใบ.aiSuggestionAt || "") + "</div></div>";
    }
    if (แสดงปุ่มอนุมัติ && ใบ.status === "รอพิจารณา") {
      html +=
        '<div class="btn-row">' +
        '<button type="button" id="ปุ่มสรุปAI">' + (ใบ.aiSuggestion ? "สรุปใหม่อีกครั้ง" : "ให้ AI ช่วยสรุปใบลา") + "</button>" +
        "</div>" +
        '<div id="คำเตือนสรุปAI" class="alert alert-warn hidden"></div>';
    }

    // ปุ่มอนุมัติ / ไม่อนุมัติ / ลบ ขึ้นเฉพาะใบที่ยังรอพิจารณา (US-07: ลบใบลาได้เฉพาะใบที่สถานะยังเป็นรอพิจารณา)
    if (ใบ.status === "รอพิจารณา") {
      if (แสดงปุ่มอนุมัติ) {
        html +=
          '<div class="btn-row">' +
          '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
          '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
          "</div>";
      }
      if (แสดงปุ่มลบ) {
        html +=
          '<div class="btn-row">' +
          '<button type="button" class="btn-danger" id="ปุ่มลบใบลา">ลบใบลา</button>' +
          "</div>";
      }
    } else {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    กล่องใบลา.innerHTML = html;

    if (ใบ.status === "รอพิจารณา") {
      if (แสดงปุ่มอนุมัติ) {
        document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
        document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
        document.getElementById("ปุ่มสรุปAI").addEventListener("click", สรุปด้วยAI);
      }
      if (แสดงปุ่มลบ) {
        document.getElementById("ปุ่มลบใบลา").addEventListener("click", ลบใบลา);
      }
    }
  }

  // ── ขั้นที่ 1: อ่านใบลานี้ (ใช้ ใบ ที่โหลดไว้แล้ว) → ขั้นที่ 2: ให้ AI เขียนสรุปสั้น ๆ ──
  async function สรุปด้วยAI() {
    var ปุ่มสรุปAI = document.getElementById("ปุ่มสรุปAI");
    var คำเตือนสรุปAI = document.getElementById("คำเตือนสรุปAI");
    คำเตือนสรุปAI.classList.add("hidden");

    var คีย์ = window.OPENROUTER_API_KEY || localStorage.getItem("openrouterApiKey");
    if (!คีย์) {
      เตือนสรุป("ยังไม่ได้ตั้งค่า OpenRouter API Key — ใส่ในไฟล์ js/ai-config.local.js (เครื่องนี้เท่านั้น) หรือกรอกที่หน้า ai-test.html ก่อน");
      return;
    }

    ปุ่มสรุปAI.disabled = true;
    ปุ่มสรุปAI.textContent = "กำลังสรุป...";

    var ตัวควบคุม = new AbortController();
    var หมดเวลา = setTimeout(function () { ตัวควบคุม.abort(); }, 15000);

    var ข้อความที่ส่ง = "ช่วยสรุปใบลานี้ให้หัวหน้าอ่านก่อนพิจารณา:\n" +
      "หัวข้อ: " + ใบ.title + "\n" +
      "ประเภทการลา: " + ใบ.leaveTypeName + "\n" +
      "วันที่ลา: " + ใบ.startDate + " ถึง " + ใบ.endDate + "\n" +
      "ผู้ขอลา: " + ใบ.requesterName + "\n" +
      "เหตุผล: " + ใบ.reason;

    try {
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
              content: "คุณคือผู้ช่วยสรุปใบลาให้หัวหน้าอ่านก่อนตัดสินใจอนุมัติ ตอบเป็นข้อความภาษาไทยล้วน สั้น กระชับ 2-3 ประโยค ไม่ต้องใส่ JSON หรือ markdown"
            },
            {
              role: "user",
              content: ข้อความที่ส่ง
            }
          ]
        })
      });

      var ข้อมูล = await ผลลัพธ์.json();
      if (!ผลลัพธ์.ok) {
        throw new Error((ข้อมูล.error && ข้อมูล.error.message) || String(ผลลัพธ์.status));
      }

      var สรุป = ข้อมูล.choices && ข้อมูล.choices[0] && ข้อมูล.choices[0].message
        ? ข้อมูล.choices[0].message.content.trim()
        : "";
      if (!สรุป) {
        await บันทึกaiLog(ข้อความที่ส่ง, "(ว่างเปล่า — AI ไม่ส่งข้อความสรุปกลับมา)");
        เตือนสรุป("AI ไม่ส่งข้อความสรุปกลับมา");
        return;
      }

      await บันทึกaiLog(ข้อความที่ส่ง, สรุป);

      // ขั้นที่ 3: เขียนสรุปกลับลงฐาน
      await บันทึกสรุปAI(สรุป);
    } catch (err) {
      var ข้อความ = err.name === "AbortError"
        ? "สรุปไม่สำเร็จ: ใช้เวลานานเกิน 15 วินาที"
        : "สรุปไม่สำเร็จ: " + err.message;
      await บันทึกaiLog(ข้อความที่ส่ง, "(error) " + ข้อความ);
      เตือนสรุป(ข้อความ);
    } finally {
      clearTimeout(หมดเวลา);
      var ปุ่มที่ยังอยู่ = document.getElementById("ปุ่มสรุปAI");
      if (ปุ่มที่ยังอยู่) {
        ปุ่มที่ยังอยู่.disabled = false;
        ปุ่มที่ยังอยู่.textContent = ใบ.aiSuggestion ? "สรุปใหม่อีกครั้ง" : "ให้ AI ช่วยสรุปใบลา";
      }
    }

    function เตือนสรุป(ข้อความ) {
      var กล่อง = document.getElementById("คำเตือนสรุปAI");
      if (!กล่อง) return;
      กล่อง.textContent = "⚠️ " + ข้อความ;
      กล่อง.classList.remove("hidden");
    }

    // เขียนผลสรุปกลับ Firestore — แก้เฉพาะช่อง aiSuggestion / aiSuggestionAt เท่านั้น
    // ⚠️ ห้ามแตะช่อง status เด็ดขาด — สถานะจริงของใบลาเปลี่ยนได้เฉพาะตอนคนกดปุ่ม
    // อนุมัติ/ไม่อนุมัติ (ฟังก์ชัน เปลี่ยนสถานะ ด้านล่าง) เท่านั้น AI ห้ามเปลี่ยนสถานะเอง
    async function บันทึกสรุปAI(ข้อความสรุป) {
      var เวลาสรุป = เวลาตอนนี้();
      await updateDoc(doc(db, "leaveRequests", รหัสใบลา), { aiSuggestion: ข้อความสรุป, aiSuggestionAt: เวลาสรุป });
      ใบ.aiSuggestion = ข้อความสรุป;
      ใบ.aiSuggestionAt = เวลาสรุป;
      วาดใบลา();
    }

    // บันทึกทุกครั้งที่เรียก AI ไว้ในโฟลเดอร์ย่อย aiLog — ไม่ทำให้ฟีเจอร์หลักพังถ้าบันทึกไม่สำเร็จ
    async function บันทึกaiLog(input, output) {
      try {
        await addDoc(collection(db, "leaveRequests", รหัสใบลา, "aiLog"), {
          input: input,
          output: output,
          createdAt: เวลาตอนนี้()
        });
      } catch (logErr) {
        console.warn("บันทึก aiLog ไม่สำเร็จ:", logErr.message);
      }
    }
  }

  // ── เปลี่ยนสถานะ — เขียนกลับ Firestore จริง แก้เฉพาะช่อง status เท่านั้น ──
  async function เปลี่ยนสถานะ(สถานะใหม่) {
    // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
    if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
      alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
      return;
    }

    var ปุ่มอนุมัติ = document.getElementById("ปุ่มอนุมัติ");
    var ปุ่มไม่อนุมัติ = document.getElementById("ปุ่มไม่อนุมัติ");
    if (ปุ่มอนุมัติ) ปุ่มอนุมัติ.disabled = true;
    if (ปุ่มไม่อนุมัติ) ปุ่มไม่อนุมัติ.disabled = true;

    try {
      await updateDoc(doc(db, "leaveRequests", รหัสใบลา), { status: สถานะใหม่ });
      ใบ.status = สถานะใหม่;   // แก้เฉพาะช่อง status เท่านั้น
      วาดใบลา();
    } catch (err) {
      alert("บันทึกสถานะลง Firestore ไม่สำเร็จ: " + err.message);
      if (ปุ่มอนุมัติ) ปุ่มอนุมัติ.disabled = false;
      if (ปุ่มไม่อนุมัติ) ปุ่มไม่อนุมัติ.disabled = false;
    }
  }

  // ── ลบใบลา — ต้องยืนยันก่อนเสมอ กด Cancel แล้วต้องไม่ลบ ──
  async function ลบใบลา() {
    if (!confirm("ยืนยันการลบใบลานี้หรือไม่ — ลบแล้วกู้คืนไม่ได้")) return;

    var ปุ่มลบ = document.getElementById("ปุ่มลบใบลา");
    if (ปุ่มลบ) ปุ่มลบ.disabled = true;

    try {
      await deleteDoc(doc(db, "leaveRequests", รหัสใบลา));
      location.href = "leave-requests.html";
    } catch (err) {
      alert("ลบไม่สำเร็จ: " + err.message);
      if (ปุ่มลบ) ปุ่มลบ.disabled = false;
    }
  }

  // ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
  function วาดความเห็น() {
    var ที่วาง = document.getElementById("รายการความเห็น");
    if (ความเห็น.length === 0) {
      ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
      return;
    }
    ที่วาง.innerHTML = ความเห็น
      .slice()
      .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
      .map(function (c) {
        return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
               "</div><div>" + esc(c.message) + "</div></div>";
      }).join("");
  }

  // ── ส่งความเห็นใหม่ — เขียนลง Firestore จริง ในโฟลเดอร์ย่อย approvals ของใบนี้ ──
  async function ส่งความเห็น() {
    var ช่อง = document.getElementById("ข้อความความเห็น");
    var เตือน = document.getElementById("เตือนความเห็น");
    var ปุ่มส่ง = document.getElementById("ปุ่มส่งความเห็น");
    var ข้อความ = ช่อง.value.trim();

    if (!ข้อความ) {
      เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
      เตือน.classList.remove("hidden");
      return;
    }
    เตือน.classList.add("hidden");

    ปุ่มส่ง.disabled = true;
    try {
      var ความเห็นใหม่ = {
        authorId: ผู้ล็อกอิน.uid,
        authorName: ผู้ล็อกอิน.name,
        message: ข้อความ,
        createdAt: เวลาตอนนี้()
      };
      var เอกสารใหม่ = await addDoc(collection(db, "leaveRequests", รหัสใบลา, "approvals"), ความเห็นใหม่);
      ความเห็น.push(Object.assign({ id: เอกสารใหม่.id }, ความเห็นใหม่));
      ช่อง.value = "";
      วาดความเห็น();
    } catch (err) {
      เตือน.textContent = "⚠️ ส่งความเห็นไม่สำเร็จ: " + err.message;
      เตือน.classList.remove("hidden");
    } finally {
      ปุ่มส่ง.disabled = false;
    }
  }
})();
