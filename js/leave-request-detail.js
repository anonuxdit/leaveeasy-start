// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: อ่านใบลาและความเห็นจริงจาก Firestore
// กดอนุมัติ/ไม่อนุมัติ แก้เฉพาะช่อง status กลับลง Firestore จริง (updateDoc)
// เขียนความเห็นยังเปลี่ยนแค่ในหน่วยความจำ (ของงานรอบถัดไป)
// ─────────────────────────────────────────────────────────────
import { db } from "./firebase-init.js";
import { requireLogin } from "./auth-guard.js";
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

(async function () {
  var ผู้ล็อกอิน = await requireLogin();

  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");

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
      }
      if (แสดงปุ่มลบ) {
        document.getElementById("ปุ่มลบใบลา").addEventListener("click", ลบใบลา);
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

  // ── ส่งความเห็นใหม่ ──
  function ส่งความเห็น() {
    var ช่อง = document.getElementById("ข้อความความเห็น");
    var เตือน = document.getElementById("เตือนความเห็น");
    var ข้อความ = ช่อง.value.trim();

    if (!ข้อความ) {
      เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
      เตือน.classList.remove("hidden");
      return;
    }
    เตือน.classList.add("hidden");

    ความเห็น.push({
      id: "ap-ใหม่-" + Date.now(),
      requestId: ใบ.id,
      authorId: ผู้ล็อกอิน.uid, authorName: ผู้ล็อกอิน.name,
      message: ข้อความ,
      createdAt: เวลาตอนนี้()
    });
    ช่อง.value = "";
    วาดความเห็น();
  }
})();
