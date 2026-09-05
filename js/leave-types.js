// ─────────────────────────────────────────────────────────────
// js/leave-types.js — หน้าที่ 4 จัดการประเภทการลา
// สัปดาห์ที่ 7: เพิ่ม แก้ ลบ ลง Firestore จริง (collection leaveTypes)
// ─────────────────────────────────────────────────────────────
import { db } from "./firebase-init.js";
import { requireLogin } from "./auth-guard.js";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

(async function () {
  var ผู้ล็อกอิน = await requireLogin();

  var ที่วางตาราง = document.getElementById("ตารางประเภท");
  var ช่องชื่อใหม่ = document.getElementById("ชื่อประเภทใหม่");
  var กล่องเตือน = document.getElementById("เตือนประเภท");

  // ตาม ACL.md — จัดการประเภทการลาเป็นสิทธิ์ของฝ่ายบุคคล (hr) เท่านั้น
  if (ผู้ล็อกอิน.role !== "hr") {
    document.querySelectorAll(".container .card").forEach(function (การ์ด) { การ์ด.remove(); });
    var กล่องไม่มีสิทธิ์ = document.createElement("div");
    กล่องไม่มีสิทธิ์.className = "alert alert-error";
    กล่องไม่มีสิทธิ์.textContent = "⚠️ หน้านี้สำหรับฝ่ายบุคคลเท่านั้น";
    document.querySelector(".container").appendChild(กล่องไม่มีสิทธิ์);
    return;
  }

  var รายการ = [];
  try {
    var สแนปช็อต = await getDocs(collection(db, "leaveTypes"));
    รายการ = สแนปช็อต.docs.map(function (d) {
      return Object.assign({ id: d.id }, d.data());
    });
  } catch (err) {
    ที่วางตาราง.innerHTML = "<p>⚠️ โหลดข้อมูลจาก Firestore ไม่สำเร็จ: " + esc(err.message) + "</p>";
    return;
  }

  วาดตาราง();
  document.getElementById("ปุ่มเพิ่ม").addEventListener("click", เพิ่มประเภท);

  function วาดตาราง() {
    if (รายการ.length === 0) {
      ที่วางตาราง.innerHTML = "<p>ยังไม่มีประเภทการลาในระบบ</p>";
      return;
    }

    var html = "<table><thead><tr><th>ชื่อประเภทการลา</th><th>จัดการ</th></tr></thead><tbody>";
    รายการ.forEach(function (ประเภท) {
      html +=
        "<tr><td>" + esc(ประเภท.name) + "</td><td>" +
        '<button type="button" class="btn-ghost" data-edit="' + esc(ประเภท.id) + '">แก้ไข</button> ' +
        '<button type="button" class="btn-danger" data-del="' + esc(ประเภท.id) + '">ลบ</button>' +
        "</td></tr>";
    });
    html += "</tbody></table>";
    ที่วางตาราง.innerHTML = html;

    ที่วางตาราง.querySelectorAll("[data-edit]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { แก้ประเภท(ปุ่ม.dataset.edit); });
    });
    ที่วางตาราง.querySelectorAll("[data-del]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { ลบประเภท(ปุ่ม.dataset.del); });
    });
  }

  async function เพิ่มประเภท() {
    var ชื่อ = ช่องชื่อใหม่.value.trim();
    if (!ชื่อ) {
      กล่องเตือน.textContent = "⚠️ พิมพ์ชื่อประเภทการลาก่อน จึงจะเพิ่มได้";
      กล่องเตือน.classList.remove("hidden");
      return;
    }
    กล่องเตือน.classList.add("hidden");

    var ปุ่มเพิ่ม = document.getElementById("ปุ่มเพิ่ม");
    ปุ่มเพิ่ม.disabled = true;
    try {
      var เอกสารใหม่ = await addDoc(collection(db, "leaveTypes"), { name: ชื่อ });
      รายการ.push({ id: เอกสารใหม่.id, name: ชื่อ });
      ช่องชื่อใหม่.value = "";
      วาดตาราง();
    } catch (err) {
      กล่องเตือน.textContent = "⚠️ เพิ่มลง Firestore ไม่สำเร็จ: " + err.message;
      กล่องเตือน.classList.remove("hidden");
    } finally {
      ปุ่มเพิ่ม.disabled = false;
    }
  }

  async function แก้ประเภท(id) {
    var ประเภท = รายการ.find(function (t) { return t.id === id; });
    var ชื่อใหม่ = prompt("แก้ชื่อประเภทการลา", ประเภท.name);
    if (ชื่อใหม่ === null) return;              // กดยกเลิก
    if (!ชื่อใหม่.trim()) { alert("ชื่อประเภทการลาว่างเปล่าไม่ได้"); return; }
    ชื่อใหม่ = ชื่อใหม่.trim();

    try {
      await updateDoc(doc(db, "leaveTypes", id), { name: ชื่อใหม่ });
      ประเภท.name = ชื่อใหม่;
      วาดตาราง();
    } catch (err) {
      alert("แก้ไขลง Firestore ไม่สำเร็จ: " + err.message);
    }
  }

  async function ลบประเภท(id) {
    var ประเภท = รายการ.find(function (t) { return t.id === id; });
    if (!confirm('ยืนยันการลบประเภท "' + ประเภท.name + '" หรือไม่')) return;

    try {
      await deleteDoc(doc(db, "leaveTypes", id));
      รายการ = รายการ.filter(function (t) { return t.id !== id; });
      วาดตาราง();
    } catch (err) {
      alert("ลบออกจาก Firestore ไม่สำเร็จ: " + err.message);
    }
  }
})();
