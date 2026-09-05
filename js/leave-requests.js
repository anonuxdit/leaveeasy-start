// ─────────────────────────────────────────────────────────────
// js/leave-requests.js — หน้าที่ 1 รายการใบลา
// สัปดาห์ที่ 6: อ่านใบลาจริงจาก Firestore (collection leaveRequests)
// ─────────────────────────────────────────────────────────────
import { db } from "./firebase-init.js";
import { requireLogin } from "./auth-guard.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

(async function () {
  var ผู้ล็อกอิน = await requireLogin();

  var กล่อง = document.getElementById("ผลลัพธ์");

  // ตาม ACL.md — พนักงานเห็นเฉพาะใบลาของตัวเอง หัวหน้า/ฝ่ายบุคคลเห็นทุกใบ
  var แหล่งข้อมูล = ผู้ล็อกอิน.role === "employee"
    ? query(collection(db, "leaveRequests"), where("requesterId", "==", ผู้ล็อกอิน.uid))
    : collection(db, "leaveRequests");

  var ใบลาจากฐานข้อมูล;
  try {
    var สแนปช็อต = await getDocs(แหล่งข้อมูล);
    ใบลาจากฐานข้อมูล = สแนปช็อต.docs.map(function (d) {
      return Object.assign({ id: d.id }, d.data());
    });
  } catch (err) {
    กล่อง.innerHTML = "<p>⚠️ โหลดข้อมูลจาก Firestore ไม่สำเร็จ: " + esc(err.message) + "</p>";
    return;
  }

  var ใบลาทั้งหมด = ใบลาจากฐานข้อมูล;

  // ถ้ามีสถานะติดมาท้าย URL ให้กรองเฉพาะสถานะนั้น
  var สถานะที่กรอง = ค่าจากURL("status");
  if (สถานะที่กรอง) {
    ใบลาทั้งหมด = ใบลาทั้งหมด.filter(function (ใบ) { return ใบ.status === สถานะที่กรอง; });
    document.querySelector(".subtitle").textContent =
      "กำลังแสดงเฉพาะใบลาที่สถานะ " + สถานะที่กรอง + " · กดเมนู รายการใบลา เพื่อดูทั้งหมด";
  }

  แสดงตาราง(ใบลาทั้งหมด);

  function แสดงตาราง(รายการ) {
    document.getElementById("จำนวนทั้งหมด").textContent = "ทั้งหมด " + รายการ.length + " ใบ";

    if (รายการ.length === 0) {
      กล่อง.innerHTML = "<p>ยังไม่มีใบขอลาในระบบ</p>";
      return;
    }

    var html =
      "<table><thead><tr>" +
      "<th>หัวข้อ</th>" +
      "<th>ประเภทการลา</th>" +
      "<th>สถานะ</th>" +
      '<th class="hide-mobile">ผู้ขอลา</th>' +
      '<th class="hide-mobile">วันที่ลา</th>' +
      "</tr></thead><tbody>";

    รายการ.forEach(function (ใบ) {
      html +=
        '<tr class="clickable" data-id="' + esc(ใบ.id) + '">' +
        "<td>" + esc(ใบ.title) + "</td>" +
        "<td>" + esc(ใบ.leaveTypeName) + "</td>" +
        "<td>" + ป้ายสถานะ(ใบ.status) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.requesterName) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate) + "</td>" +
        "</tr>";
    });

    html += "</tbody></table>";
    กล่อง.innerHTML = html;

    // กดที่แถวไหน ไปหน้ารายละเอียดของใบนั้น
    กล่อง.querySelectorAll("tr.clickable").forEach(function (แถว) {
      แถว.addEventListener("click", function () {
        location.href = "leave-request-detail.html?id=" + แถว.dataset.id;
      });
    });
  }
})();
